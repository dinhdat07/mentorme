import {
  ClassStatus,
  LocationType,
  Prisma,
  PrismaClient,
  TutorAvailability,
  TutorProfile,
  UserStatus,
} from "@prisma/client";
import { cosineSimilarity, generateEmbedding } from "./embeddings";

export interface TimeSlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface MatchingRequest {
  subjectId: string;
  gradeLevel: string;
  city?: string | undefined;
  district?: string | undefined;
  budgetPerHour: number;
  desiredSlots: TimeSlot[];
  description?: string | undefined;
}

export type TutorWithRelations = TutorProfile & {
  classes: {
    id: string;
    subjectId: string;
    targetGrade: string | null;
    pricePerHour: number;
    locationType: LocationType;
    city: string | null;
    district: string | null;
  }[];
  availabilities: TutorAvailability[];
};

export interface MatchedTutor {
  tutor: TutorWithRelations;
  score: number;
  reasons: string[];
}

function computeTimeOverlapScore(
  availabilities: TutorAvailability[],
  desiredSlots: TimeSlot[]
): number {
  if (desiredSlots.length === 0) {
    return 0.5;
  }

  const desiredMinutes = desiredSlots.reduce(
    (total, slot) => total + Math.max(0, slot.endMinute - slot.startMinute),
    0
  );
  if (desiredMinutes === 0) {
    return 0.5;
  }

  let overlapMinutes = 0;
  desiredSlots.forEach((slot) => {
    const matchingDay = availabilities.filter((avail) => avail.dayOfWeek === slot.dayOfWeek);
    let slotOverlap = 0;
    matchingDay.forEach((avail) => {
      const overlapStart = Math.max(avail.startMinute, slot.startMinute);
      const overlapEnd = Math.min(avail.endMinute, slot.endMinute);
      if (overlapEnd > overlapStart) {
        slotOverlap = Math.max(slotOverlap, overlapEnd - overlapStart);
      }
    });
    overlapMinutes += slotOverlap;
  });

  return Math.max(0, Math.min(1, overlapMinutes / desiredMinutes));
}

function computePriceScore(
  budgetPerHour: number,
  classes: { pricePerHour: number }[]
): number {
  if (classes.length === 0 || budgetPerHour <= 0) {
    return 0.5;
  }

  const closestPrice = classes.reduce<number | null>((closest, cls) => {
    if (closest === null) {
      return cls.pricePerHour;
    }
    const currentDiff = Math.abs(cls.pricePerHour - budgetPerHour);
    const bestDiff = Math.abs(closest - budgetPerHour);
    return currentDiff < bestDiff ? cls.pricePerHour : closest;
  }, null);

  if (closestPrice === null) {
    return 0.5;
  }
  if (closestPrice <= budgetPerHour) {
    return 1;
  }

  const overBudget = closestPrice - budgetPerHour;
  const tolerance = Math.max(5, budgetPerHour * 0.25);
  return Math.max(0, 1 - overBudget / tolerance);
}

function computeLocationScore(tutor: TutorWithRelations, request: MatchingRequest): number {
  if (!request.city && !request.district) {
    return 0.5;
  }

  const hasOnline =
    tutor.availabilities.some((avail) => avail.locationType === LocationType.ONLINE) ||
    tutor.classes.some((cls) => cls.locationType === LocationType.ONLINE);

  const cityMatch =
    request.city &&
    tutor.city &&
    tutor.city.toLowerCase() === request.city.toLowerCase();
  const districtMatch =
    request.district &&
    tutor.district &&
    tutor.district.toLowerCase() === request.district.toLowerCase();

  if (districtMatch) {
    return 1;
  }
  if (cityMatch) {
    return hasOnline ? 1 : 0.75;
  }
  if (hasOnline) {
    return 0.7;
  }
  return 0.3;
}

function computeMatchingScore(params: {
  subjectMatch: number;
  gradeMatch: number;
  timeOverlapScore: number;
  priceScore: number;
  locationScore: number;
  trustScore: number;
  semanticScore: number;
}): number {
  const trustComponent = Math.max(0, Math.min(1, params.trustScore / 100));
  const semanticComponent = Math.max(0, Math.min(1, params.semanticScore));

  return (
    0.25 * params.subjectMatch +
    0.1 * params.gradeMatch +
    0.15 * params.timeOverlapScore +
    0.1 * params.priceScore +
    0.1 * params.locationScore +
    0.15 * trustComponent +
    0.15 * semanticComponent
  );
}

function normalizeEmbedding(value: Prisma.JsonValue | null): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.every((v) => typeof v === "number") ? (value as number[]) : null;
}

export async function matchTutors(
  prisma: PrismaClient,
  request: MatchingRequest,
  limit = 10
): Promise<MatchedTutor[]> {
  const classFilter: Prisma.ClassWhereInput = {
    status: ClassStatus.PUBLISHED,
    isDeleted: false,
    subjectId: request.subjectId,
  };

  const where: Prisma.TutorProfileWhereInput = {
    classes: { some: classFilter },
    user: { status: UserStatus.ACTIVE },
  };
  if (request.city) {
    where.city = request.city;
  }
  if (request.district) {
    where.district = request.district;
  }

  const tutors = await prisma.tutorProfile.findMany({
    where,
    include: {
      classes: { where: classFilter },
      availabilities: true,
    },
  });

  const descriptionText = request.description?.trim();
  const requestEmbedding =
    descriptionText && descriptionText.length > 0
      ? await generateEmbedding(descriptionText)
      : null;

  const results: MatchedTutor[] = tutors.map((tutor) => {
    const subjectMatch = tutor.classes.some((cls) => cls.subjectId === request.subjectId) ? 1 : 0;
    const gradeMatch =
      tutor.classes.some((cls) =>
        (cls.targetGrade ?? "").toLowerCase().includes(request.gradeLevel.toLowerCase())
      ) || request.gradeLevel.length === 0
        ? 1
        : 0;

    const timeOverlapScore = computeTimeOverlapScore(tutor.availabilities, request.desiredSlots);
    const priceScore = computePriceScore(
      request.budgetPerHour,
      tutor.classes.map((cls) => ({ pricePerHour: cls.pricePerHour }))
    );
    const locationScore = computeLocationScore(tutor, request);

    let semanticScore = 0.5;
    if (requestEmbedding) {
      const tutorEmbedding = normalizeEmbedding(tutor.profileEmbedding);
      if (tutorEmbedding) {
        semanticScore = cosineSimilarity(requestEmbedding, tutorEmbedding);
      }
    }

    const score = computeMatchingScore({
      subjectMatch,
      gradeMatch,
      timeOverlapScore,
      priceScore,
      locationScore,
      trustScore: tutor.trustScore,
      semanticScore,
    });

    const reasons: string[] = [];
    if (subjectMatch) reasons.push("Matches requested subject");
    if (gradeMatch) reasons.push("Supports requested grade level");
    if (timeOverlapScore > 0.5) reasons.push("Good schedule overlap");
    if (priceScore >= 0.8) reasons.push("Within budget range");
    if (locationScore >= 0.7) reasons.push("Location preference matched");
    if (semanticScore > 0.6) reasons.push("Profile aligns with description");

    return { tutor, score, reasons };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
