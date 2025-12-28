import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/me", authGuard(), async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Math.min(Number(req.query.pageSize ?? 20), 50);
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
    ]);
    const unread = await prisma.notification.count({ where: { userId: req.user!.id, readAt: null } });
    return res.json({ data: items, total, page, pageSize, unread });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/read", authGuard(), async (req, res) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif || notif.userId !== req.user!.id) {
      return res.status(404).json({ message: "Notification not found" });
    }
    const updated = await prisma.notification.update({
      where: { id: notif.id },
      data: { readAt: new Date() },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/read-all", authGuard(), async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    return res.json({ message: "OK" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", authGuard([UserRole.ADMIN]), async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const where: any = {};
    if (type) where.type = type;
    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
