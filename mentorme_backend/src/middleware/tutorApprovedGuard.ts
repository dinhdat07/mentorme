import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export const tutorApprovedGuard = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== UserRole.TUTOR) return res.status(403).json({ message: "Forbidden" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        status: true,
        tutorProfile: { select: { verified: true } },
      },
    });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const verified = user.tutorProfile?.verified ?? false;

    if (user.status !== UserStatus.ACTIVE || !verified) {
      return res.status(403).json({
        message: "Tutor chưa được duyệt",
        userStatus: user.status,
        verified,
      });
    }

    next();
  };
};
