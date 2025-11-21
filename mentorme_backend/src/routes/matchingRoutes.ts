import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { ClassStatus, Prisma } from "@prisma/client";

const router = Router();

const filterSchema = z.object({
  subjectId: z.string().uuid().optional(),
  city: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
});

router.get("/tutors", async (req, res) => {
  try {
    const query = filterSchema.parse({
      subjectId: req.query.subjectId,
      city: req.query.city,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
    });

    console.log("Query", query);
    let effectiveSubjectId = query.subjectId;
    const effectiveCity = query.city;

    const where: Prisma.TutorProfileWhereInput = {
      verified: true,
    };
    if (effectiveCity) {
      where.city = effectiveCity;
    }

    const shouldFilterClasses =
      effectiveSubjectId !== undefined ||
      query.priceMin !== undefined ||
      query.priceMax !== undefined;

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

    const tutors = await prisma.tutorProfile.findMany({
      where,
      include: {
        user: true,
        classes: {
          where: includeClassesFilter,
        },
      },
      orderBy: [{ trustScore: "desc" }, { averageRating: "desc" }],
      take: 20,
    });

    console.log(tutors);
    const results = tutors.map((tutor) => {
      const matchScore =
        tutor.trustScore * 0.6 +
        tutor.averageRating * 8 +
        (tutor.totalCompletedBookings ?? 0);
      return {
        tutor: {
          ...tutor,
          fullName: tutor.user.fullName, // <- thêm tên đầy đủ vào object
        },
        matchScore,
      };
    });

    return res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
