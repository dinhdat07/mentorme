import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { BookingStatus, UserRole } from "@prisma/client";

const router = Router();

// --- API CHO GIA SƯ (TUTOR) ---
router.get("/tutor", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!tutor)
      return res.status(404).json({ message: "Tutor profile not found" });

    // 1. Lấy danh sách lớp đang dạy
    const activeBookings = await prisma.booking.findMany({
      where: {
        tutorId: tutor.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
      },
      include: {
        class: {
          select: {
            title: true,
            locationType: true,
            subject: { select: { name: true } }, // Lấy tên môn học
          },
        },
        student: {
          include: {
            user: { select: { fullName: true } }, // Lấy tên học sinh
          },
        },
      },
    });

    const scheduleList = [];

    // 2. Duyệt qua booking để lấy lịch cố định
    for (const booking of activeBookings) {
      if (!booking.noteFromStudent) continue;

      try {
        const noteData = JSON.parse(booking.noteFromStudent);
        const slot = noteData.preferredSlot; // { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" }

        if (slot) {
          scheduleList.push({
            id: booking.id,

            // Thông tin hiển thị cho Gia sư
            studentName: booking.student.user.fullName,
            subjectName: booking.class.subject.name,
            className: booking.class.title,

            // Thời gian học
            dayOfWeek: slot.dayOfWeek, // 0 (CN) -> 6 (T7)
            startTime: slot.startTime, // "14:00"
            endTime: slot.endTime, // "16:00"

            status: booking.status,
            locationType: booking.class.locationType,
          });
        }
      } catch (e) {
        // Bỏ qua nếu lỗi parse JSON
      }
    }

    // 3. Sắp xếp: Thứ (0-6) -> Giờ bắt đầu
    scheduleList.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    return res.json(scheduleList);
  } catch (error) {
    console.error("Calendar Tutor Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// --- API CHO HỌC SINH (STUDENT) ---
router.get("/student", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!student)
      return res.status(404).json({ message: "Student profile not found" });

    // 1. Lấy danh sách lớp đang học
    const activeBookings = await prisma.booking.findMany({
      where: {
        studentId: student.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
      },
      include: {
        class: {
          select: {
            title: true,
            locationType: true,
            subject: { select: { name: true } }, // Lấy tên môn học
            tutor: {
              select: { user: { select: { fullName: true } } }, // Lấy tên gia sư
            },
          },
        },
      },
    });

    const scheduleList = [];

    // 2. Duyệt qua booking để lấy lịch cố định
    for (const booking of activeBookings) {
      if (!booking.noteFromStudent) continue;

      try {
        const noteData = JSON.parse(booking.noteFromStudent);
        const slot = noteData.preferredSlot;

        if (slot) {
          scheduleList.push({
            id: booking.id,

            // Thông tin hiển thị cho Học sinh
            tutorName: booking.class.tutor.user.fullName,
            subjectName: booking.class.subject.name,
            className: booking.class.title,

            // Thời gian học
            dayOfWeek: slot.dayOfWeek, // 0 (CN) -> 6 (T7)
            startTime: slot.startTime, // "18:00"
            endTime: slot.endTime, // "20:00"

            status: booking.status,
            locationType: booking.class.locationType,
          });
        }
      } catch (e) {
        // Ignore
      }
    }

    // 3. Sắp xếp: Thứ -> Giờ
    scheduleList.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    return res.json(scheduleList);
  } catch (error) {
    console.error("Calendar Student Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
