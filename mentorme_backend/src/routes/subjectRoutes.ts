import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { authGuard } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });
    return res.json(subjects);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1),
  description: z.string().optional(),
});

router.post("/", authGuard([UserRole.ADMIN]), async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);
    const subject = await prisma.subject.create({
      data: {
        name: payload.name,
        level: payload.level,
        description: payload.description ?? null,
      },
    });
    return res.status(201).json(subject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
