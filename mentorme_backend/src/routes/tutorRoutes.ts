import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { ClassStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

router.get("/me", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    return res.json(tutor);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const updateSchema = z.object({
  bio: z.string().optional(),
  education: z.string().optional(),
  certificates: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
  hourlyRateMin: z.number().min(0).optional(),
  hourlyRateMax: z.number().min(0).optional(),
  teachingModes: z.array(z.string()).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
});

router.patch("/me", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = updateSchema.parse(req.body);
    const data: Prisma.TutorProfileUpdateInput = {};
    if (payload.bio !== undefined) data.bio = payload.bio;
    if (payload.education !== undefined) data.education = payload.education;
    if (payload.certificates !== undefined) data.certificates = payload.certificates;
    if (payload.yearsOfExperience !== undefined) data.yearsOfExperience = payload.yearsOfExperience;
    if (payload.hourlyRateMin !== undefined) data.hourlyRateMin = payload.hourlyRateMin;
    if (payload.hourlyRateMax !== undefined) data.hourlyRateMax = payload.hourlyRateMax;
    if (payload.teachingModes !== undefined) data.teachingModes = payload.teachingModes;
    if (payload.city !== undefined) data.city = payload.city;
    if (payload.district !== undefined) data.district = payload.district;

    const tutor = await prisma.tutorProfile.update({
      where: { userId: req.user!.id },
      data,
    });
    return res.json(tutor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me/classes", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!tutor) {
      return res.status(400).json({ message: "Tutor profile not found" });
    }
    const classes = await prisma.class.findMany({
      where: { tutorId: tutor.id, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    return res.json(classes);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const filterSchema = z.object({
      subjectId: z.string().uuid().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      trustScoreMin: z.number().optional(),
      page: z.number().int().min(1).optional().default(1),
      pageSize: z.number().int().min(1).max(50).optional().default(10),
    });

    const query = filterSchema.parse({
      subjectId: req.query.subjectId,
      city: req.query.city,
      district: req.query.district,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      trustScoreMin: req.query.trustScoreMin ? Number(req.query.trustScoreMin) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    });

    const classFilter: Record<string, unknown> = {
      status: ClassStatus.PUBLISHED,
      isDeleted: false,
    };

    if (query.subjectId) {
      classFilter.subjectId = query.subjectId;
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      const priceRange: Record<string, number> = {};
      if (query.priceMin !== undefined) {
        priceRange.gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        priceRange.lte = query.priceMax;
      }
      classFilter.pricePerHour = priceRange;
    }

    const where: Record<string, unknown> = {
      verified: true,
      trustScore: query.trustScoreMin ? { gte: query.trustScoreMin } : undefined,
      city: query.city,
      district: query.district,
    };

    if (query.subjectId || query.priceMin !== undefined || query.priceMax !== undefined) {
      where.classes = { some: classFilter };
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          classes: {
            where: { status: ClassStatus.PUBLISHED, isDeleted: false },
          },
        },
        orderBy: [
          { trustScore: "desc" },
          { averageRating: "desc" },
          { totalCompletedBookings: "desc" },
        ],
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    return res.json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:tutorId/classes", async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: {
        tutorId: req.params.tutorId,
        isDeleted: false,
        status: ClassStatus.PUBLISHED,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(classes);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { tutorId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            gradeLevel: true,
          },
        },
      },
    });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/trust-score", async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      select: {
        trustScore: true,
        averageRating: true,
        totalCompletedBookings: true,
        totalReviews: true,
      },
    });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    return res.json(tutor);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        classes: {
          where: { isDeleted: false },
        },
      },
    });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    return res.json(tutor);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
