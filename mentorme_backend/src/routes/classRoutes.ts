import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middleware/auth";
import {
  BookingStatus,
  ClassStatus,
  LocationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

const router = Router();

const listSchema = z.object({
  tutorId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/", async (req, res) => {
  try {
    const query = listSchema.parse(req.query);
    const where: Prisma.ClassWhereInput = {
      status: query.status ?? ClassStatus.PUBLISHED,
    };
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }
    if (query.tutorId) where.tutorId = query.tutorId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.city) where.city = query.city;
    if (query.district) where.district = query.district;

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    return res.json({
      data: items,
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

const baseClassSchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  targetGrade: z.string().optional(),
  pricePerHour: z.number().min(0),
  locationType: z.nativeEnum(LocationType),
  city: z.string().optional(),
  district: z.string().optional(),
});

router.post("/", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = baseClassSchema.parse(req.body);

    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tutor) {
      return res.status(400).json({ message: "Tutor profile not found" });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: payload.subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const classListing = await prisma.class.create({
      data: {
        tutorId: tutor.id,
        subjectId: payload.subjectId,
        title: payload.title,
        description: payload.description,
        targetGrade: payload.targetGrade ?? null,
        pricePerHour: payload.pricePerHour,
        locationType: payload.locationType,
        city: payload.city ?? null,
        district: payload.district ?? null,
      },
    });

    return res.status(201).json(classListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const updateSchema = baseClassSchema.partial();

router.patch("/:id", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = updateSchema.parse(req.body);

    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }

    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tutor || classListing.tutorId !== tutor.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data: Prisma.ClassUpdateInput = {};
    if (payload.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: payload.subjectId } });
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      data.subject = { connect: { id: payload.subjectId } };
    }
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.targetGrade !== undefined) data.targetGrade = payload.targetGrade ?? null;
    if (payload.pricePerHour !== undefined) data.pricePerHour = payload.pricePerHour;
    if (payload.locationType !== undefined) data.locationType = payload.locationType;
    if (payload.city !== undefined) data.city = payload.city ?? null;
    if (payload.district !== undefined) data.district = payload.district ?? null;

    const updated = await prisma.class.update({
      where: { id: classListing.id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const statusSchema = z.object({
  status: z.nativeEnum(ClassStatus),
});

router.patch("/:id/status", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const payload = statusSchema.parse(req.body);
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const updated = await prisma.class.update({
      where: { id: classListing.id },
      data: { status: payload.status },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classListing.status !== ClassStatus.ARCHIVED) {
      return res.status(400).json({ message: "Class must be archived before deletion" });
    }

    const activeBookings = await prisma.booking.count({
      where: {
        classId: classListing.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({ message: "Active bookings exist" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    await prisma.class.update({
      where: { id: classListing.id },
      data: { isDeleted: true },
    });

    return res.json({ message: "Class deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/students", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const students = await prisma.booking.findMany({
      where: {
        classId: classListing.id,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL, BookingStatus.COMPLETED],
        },
      },
      include: {
        student: true,
      },
    });

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        tutor: true,
        subject: true,
      },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    return res.json(classListing);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
