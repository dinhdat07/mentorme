import { Prisma, PrismaClient } from "@prisma/client";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "all-MiniLM-L6-v2";
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL ?? "http://localhost:8000/embed";

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleaned = text.trim();
  if (!cleaned) {
    return [];
  }

  const response = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: cleaned }),
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { embedding?: number[]; model?: string };
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("Failed to generate embedding");
  }

  return data.embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dot += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function updateTutorProfileEmbedding(
  prisma: PrismaClient,
  tutorId: string
): Promise<void> {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    select: {
      bio: true,
      education: true,
      certificates: true,
    },
  });

  if (!tutor) {
    throw new Error(`TutorProfile not found for id ${tutorId}`);
  }

  const parts: string[] = [];
  if (tutor.bio) parts.push(tutor.bio);
  if (tutor.education) parts.push(tutor.education);
  if (tutor.certificates && tutor.certificates.length > 0) {
    parts.push(tutor.certificates.join("\n"));
  }

  const combined = parts.join("\n").trim();
  if (!combined) {
    const data: Prisma.TutorProfileUpdateInput = {
      profileEmbedding: Prisma.DbNull,
      profileEmbeddingModel: null,
    };
    await prisma.tutorProfile.update({
      where: { id: tutorId },
      data,
    });
    return;
  }

  const embedding = await generateEmbedding(combined);

  const data: Prisma.TutorProfileUpdateInput = {
    profileEmbedding: embedding,
    profileEmbeddingModel: EMBEDDING_MODEL,
  };

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data,
  });
}

export async function backfillTutorEmbeddings(
  prisma: PrismaClient,
  options: { batchSize?: number; skipIds?: string[] } = {}
): Promise<{ total: number; succeeded: number; failed: number }> {
  const batchSize = options.batchSize ?? 25;
  const skipIds = options.skipIds ?? [];

  const args: Prisma.TutorProfileFindManyArgs = {
    select: { id: true },
    orderBy: { createdAt: "asc" },
  };
  if (skipIds.length) {
    args.where = { id: { notIn: skipIds } };
  }

  const tutors = await prisma.tutorProfile.findMany(args);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < tutors.length; i += batchSize) {
    const slice = tutors.slice(i, i + batchSize);
    // Run each batch sequentially to avoid overloading embedding service
    // while still limiting memory usage.
    for (const tutor of slice) {
      try {
        await updateTutorProfileEmbedding(prisma, tutor.id);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        // eslint-disable-next-line no-console
        console.error(`Failed to update embedding for tutor ${tutor.id}`, error);
      }
    }
  }

  return { total: tutors.length, succeeded, failed };
}
