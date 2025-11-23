import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { ClassStatus, Prisma, UserStatus } from "@prisma/client";

const router = Router();

const filterSchema = z.object({
  studentId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  gradeLevel: z.string().optional(),
});

router.get("/tutors", async (req, res) => {
  try {
    const query = filterSchema.parse({
      studentId: req.query.studentId,
      subjectId: req.query.subjectId,
      city: req.query.city,
      district: req.query.district,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      gradeLevel: req.query.gradeLevel,
    });

    let effectiveSubjectId = query.subjectId;
    const effectiveCity = query.city;
    const effectiveDistrict = query.district;

    if (query.studentId) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: query.studentId },
      });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!effectiveSubjectId && student.preferredSubjects.length > 0) {
        effectiveSubjectId = student.preferredSubjects[0];
      }
    }

    const where: Prisma.TutorProfileWhereInput = {
      verified: true,
      user: { status: UserStatus.ACTIVE },
    };
    if (effectiveCity) {
      where.city = effectiveCity;
    }
    if (effectiveDistrict) {
      where.district = effectiveDistrict;
    }

    const shouldFilterClasses =
      effectiveSubjectId !== undefined ||
      query.priceMin !== undefined ||
      query.priceMax !== undefined ||
      query.gradeLevel !== undefined;

    const classFilter: Prisma.ClassWhereInput = {
      status: ClassStatus.PUBLISHED,
      isDeleted: false,
    };
    if (effectiveSubjectId) {
      classFilter.subjectId = effectiveSubjectId;
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      classFilter.pricePerHour = {};
      if (query.priceMin !== undefined) {
        classFilter.pricePerHour.gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        classFilter.pricePerHour.lte = query.priceMax;
      }
    }
    if (query.gradeLevel) {
      classFilter.targetGrade = {
        contains: query.gradeLevel,
        mode: "insensitive",
      };
    }

    if (shouldFilterClasses) {
      where.classes = { some: classFilter };
    }

    const includeClassesFilter: Prisma.ClassWhereInput = {
      status: ClassStatus.PUBLISHED,
      isDeleted: false,
    };
    if (effectiveSubjectId) {
      includeClassesFilter.subjectId = effectiveSubjectId;
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      includeClassesFilter.pricePerHour = {};
      if (query.priceMin !== undefined) {
        includeClassesFilter.pricePerHour.gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        includeClassesFilter.pricePerHour.lte = query.priceMax;
      }
    }
    if (query.gradeLevel) {
      includeClassesFilter.targetGrade = {
        contains: query.gradeLevel,
        mode: "insensitive",
      };
    }

    const tutors = await prisma.tutorProfile.findMany({
      where,
      include: {
        classes: {
          where: includeClassesFilter,
        },
      },
      orderBy: [{ trustScore: "desc" }],
      take: 20,
    });

    const results = tutors
      .map((tutor) => {
        const subjectMatch = effectiveSubjectId
          ? tutor.classes.some((cls) => cls.subjectId === effectiveSubjectId)
          : false;
        const gradeMatch = query.gradeLevel
          ? tutor.classes.some((cls) => (cls.targetGrade ?? "").toLowerCase().includes(query.gradeLevel!.toLowerCase()))
          : false;

        let pricePenalty = 0;
        if (query.priceMin !== undefined || query.priceMax !== undefined) {
          const priceRange = [
            query.priceMin ?? Number.NEGATIVE_INFINITY,
            query.priceMax ?? Number.POSITIVE_INFINITY,
          ];
          const closestPrice = tutor.classes.reduce<number | null>((acc, cls) => {
            if (cls.pricePerHour === undefined || cls.pricePerHour === null) return acc;
            if (acc === null) return cls.pricePerHour;
            return Math.abs(cls.pricePerHour - priceRange[0]) < Math.abs(acc - priceRange[0])
              ? cls.pricePerHour
              : acc;
          }, null);
          if (closestPrice !== null) {
            if (closestPrice < priceRange[0]) pricePenalty += priceRange[0] - closestPrice;
            if (closestPrice > priceRange[1]) pricePenalty += closestPrice - priceRange[1];
          }
        }

        const matchScore =
          tutor.trustScore * 0.5 +
          tutor.averageRating * 10 +
          (tutor.totalCompletedBookings ?? 0) * 2 +
          (subjectMatch ? 6 : 0) +
          (gradeMatch ? 4 : 0) -
          pricePenalty;

        return { tutor, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
