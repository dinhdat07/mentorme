import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { UserRole, BookingStatus } from "@prisma/client";
import { z } from "zod";
import {
  confirmPaymentIntent,
  createDepositIntent,
  getEscrowSummary,
} from "../services/escrow";

const router = Router();

const intentSchema = z.object({
  packageSessionsCount: z.number().int().min(1),
  amountPerSession: z.number().positive().optional(),
  currency: z.string().optional(),
});

router.post(
  "/classes/:id/payments/intents",
  authGuard([UserRole.STUDENT, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const payload = intentSchema.parse(req.body);
      const classId = req.params.id;
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
      if (req.user!.role === UserRole.STUDENT && !student) {
        return res.status(400).json({ message: "Student profile not found" });
      }

      const classListing = await prisma.class.findUnique({
        where: { id: classId },
        include: { tutor: true },
      });
      if (!classListing || classListing.isDeleted) {
        return res.status(404).json({ message: "Class not found" });
      }

      const schedule = await prisma.classSchedule.findUnique({ where: { classId } });
      if (!schedule) {
        return res.status(400).json({ message: "Class must have a schedule before payment" });
      }

      if (req.user!.role === UserRole.STUDENT) {
        const booking = await prisma.booking.findFirst({
          where: {
            classId,
            studentId: student!.id,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
          },
        });
        if (!booking) {
          return res.status(403).json({ message: "You have no booking for this class" });
        }
      }

      const amountPerSession = payload.amountPerSession ?? classListing.pricePerHour;
      if (!amountPerSession || amountPerSession <= 0) {
        return res.status(400).json({ message: "Invalid amount per session" });
      }

      const intent = await createDepositIntent(prisma, {
        classId,
        payerId: req.user!.id,
        packageSessionsCount: payload.packageSessionsCount,
        amountPerSession,
        currency: payload.currency,
      });

      return res.status(201).json(intent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payload", issues: error.issues });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/payments/:intentId/confirm",
  authGuard([UserRole.STUDENT, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const intentId = req.params.intentId;
      const intent = await prisma.paymentIntent.findUnique({ where: { id: intentId } });
      if (!intent) {
        return res.status(404).json({ message: "Payment intent not found" });
      }
      if (req.user!.role === UserRole.STUDENT && intent.payerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const result = await confirmPaymentIntent(prisma, intentId);
      return res.json(result);
    } catch (error: any) {
      if (error.status === 404) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/classes/:id/payments/summary",
  authGuard([UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const classId = req.params.id;
      const classListing = await prisma.class.findUnique({
        where: { id: classId },
        include: { tutor: true },
      });
      if (!classListing || classListing.isDeleted) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (req.user!.role === UserRole.TUTOR) {
        const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } });
        if (!tutor || tutor.id !== classListing.tutorId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      if (req.user!.role === UserRole.STUDENT) {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!student) {
          return res.status(400).json({ message: "Student profile not found" });
        }
        const booking = await prisma.booking.findFirst({
          where: {
            classId,
            studentId: student.id,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.TRIAL, BookingStatus.COMPLETED] },
          },
        });
        if (!booking) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const summary = await getEscrowSummary(prisma, classId, {
        take: Number(req.query.take ?? 20),
        skip: Number(req.query.skip ?? 0),
      });

      const completedSessions = await prisma.session.findMany({
        where: { classId, status: "COMPLETED" as any },
        select: { id: true },
      });
      const paidSessionIds = new Set(summary.paidReleases.filter(Boolean));
      const unpaidCompleted = completedSessions.filter((s) => !paidSessionIds.has(s.id)).length;

      const nextReleaseAmount = classListing.pricePerHour;

      return res.json({
        escrow: summary.escrow,
        ledger: summary.ledger,
        unpaidCompleted,
        nextReleaseAmount,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
