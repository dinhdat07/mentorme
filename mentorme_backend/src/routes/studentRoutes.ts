import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

router.get("/me", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.json(student);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const updateSchema = z.object({
  gradeLevel: z.string().optional(),
  goals: z.string().optional(),
  preferredSubjects: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

router.patch("/me", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const payload = updateSchema.parse(req.body);
    const data: Prisma.StudentProfileUpdateInput = {};
    if (payload.gradeLevel !== undefined) data.gradeLevel = payload.gradeLevel;
    if (payload.goals !== undefined) data.goals = payload.goals;
    if (payload.preferredSubjects !== undefined) data.preferredSubjects = payload.preferredSubjects;
    if (payload.notes !== undefined) data.notes = payload.notes;

    const student = await prisma.studentProfile.update({
      where: { userId: req.user!.id },
      data,
    });
    return res.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
