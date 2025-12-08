import { prisma } from "../lib/prisma";
import { backfillTutorEmbeddings } from "../domain/embeddings";

async function main() {
  console.log("Starting tutor embedding backfill...");
  const start = Date.now();

  const result = await backfillTutorEmbeddings(prisma);

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `Finished backfill in ${duration}s. Total: ${result.total}, ok: ${result.succeeded}, failed: ${result.failed}`
  );

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("Backfill failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
