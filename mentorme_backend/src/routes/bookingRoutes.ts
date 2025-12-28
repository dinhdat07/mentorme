import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
import {
  BookingStatus,
  CancelledBy,
  ClassStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

const VS = VerificationStatus ?? {
  VERIFIED: "VERIFIED",
};
import { z } from "zod";
import { recalculateTutorStats } from "../services/tutorStats";

function getDateByDayOfWeek(baseDate: Date, targetDay: number) {
  const date = new Date(baseDate);
  const currentDay = date.getDay(); // 0 (CN) → 6 (T7)
  const diff = (targetDay + 7 - currentDay) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

const router = Router();

const createSchema = z.object({
  classId: z.string(),
  isTrial: z.boolean(),
  requestedHoursPerWeek: z.number(),
  startDateExpected: z.string(),

  preferredSlot: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(), // "18:00"
    endTime: z.string(), // "20:00"
  }),

  noteFromStudent: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().optional(),
});

const getStudentIdByUser = async (userId: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  return student?.id;
};

const getTutorIdByUser = async (userId: string) => {
  const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
  return tutor?.id;
};

router.post("/", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);

    const studentId = await getStudentIdByUser(req.user!.id);
    if (!studentId) {
      return res.status(400).json({ message: "Student not found" });
    }

    // Kiểm tra lớp có tồn tại không
    const classData = await prisma.class.findUnique({
      where: { id: payload.classId },
      select: { tutorId: true, title: true }, // Lấy title để hiển thị thông báo cho rõ
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // === LOGIC CHECK TRÙNG LỚP ===
    // Tìm xem đã có booking nào của học sinh này, cho CHÍNH XÁC lớp này (classId)
    // mà trạng thái chưa kết thúc hay không.
    const existingBooking = await prisma.booking.findFirst({
      where: {
        studentId: studentId,
        classId: payload.classId, // So khớp chính xác ID lớp học
        status: {
          // Các trạng thái được coi là "Đang học" hoặc "Đang chờ"
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.TRIAL,
          ],
        },
      },
    });

    // Nếu tìm thấy => Chặn
    if (existingBooking) {
      // Tùy chỉnh thông báo dựa trên trạng thái cũ
      let msg = "Bạn đã đăng ký lớp này rồi.";
      if (existingBooking.status === BookingStatus.PENDING) {
        msg =
          "Yêu cầu đăng ký của bạn cho lớp này đang chờ gia sư duyệt. Vui lòng không gửi lại.";
      } else {
        msg =
          "Bạn đang theo học lớp này rồi. Không thể đăng ký lại trừ khi lớp học kết thúc hoặc bị hủy.";
      }

      return res.status(409).json({
        message: msg,
        bookingId: existingBooking.id, // Trả về ID cũ nếu FE muốn redirect người dùng tới đó
      });
    }

    // === HẾT PHẦN CHECK, TẠO BOOKING MỚI ===
    const booking = await prisma.booking.create({
      data: {
        class: {
          connect: { id: payload.classId },
        },
        student: {
          connect: { id: studentId },
        },
        tutor: {
          connect: { id: classData.tutorId },
        },
        isTrial: payload.isTrial,
        requestedHoursPerWeek: payload.requestedHoursPerWeek,
        startDateExpected: new Date(payload.startDateExpected),

        noteFromStudent: JSON.stringify({
          preferredSlot: payload.preferredSlot,
          note: payload.noteFromStudent,
        }),
      },
    });

    res.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Dữ liệu không hợp lệ", issues: error.issues });
    }
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/", authGuard(), async (req, res) => {
  try {
    const statusFilter = Array.isArray(req.query.status)
      ? (req.query.status as string[])
      : req.query.status
      ? [req.query.status as string]
      : undefined;

    const where: Record<string, unknown> = {};

    if (statusFilter) {
      where.status = { in: statusFilter as BookingStatus[] };
    }

    if (req.user!.role === UserRole.STUDENT) {
      const studentId = await getStudentIdByUser(req.user!.id);
      if (!studentId) {
        return res.status(400).json({ message: "Student profile not found" });
      }
      where.studentId = studentId;
    } else if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      if (!tutorId) {
        return res.status(400).json({ message: "Tutor profile not found" });
      }
      where.tutorId = tutorId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        class: true,
        student: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", authGuard(), async (req, res) => {
  try {
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        class: true,
        student: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    let isOwner = false;
    if (req.user!.role === UserRole.STUDENT) {
      const studentId = await getStudentIdByUser(req.user!.id);
      isOwner = !!studentId && booking.studentId === studentId;
    } else if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      isOwner = !!tutorId && booking.tutorId === tutorId;
    } else if (req.user!.role === UserRole.ADMIN) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/confirm", authGuard([UserRole.TUTOR]), async (req, res) => {
  const bookingId = req.params.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  // 1. check tồn tại
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  // 1.1 không cho confirm nếu đã hoàn thành hoặc đã huỷ
  if (
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.CANCELLED
  ) {
    return res.status(400).json({
      message: "Booking already finalized",
    });
  }

  // 2. chỉ cho confirm booking pending
  if (booking.status !== BookingStatus.PENDING) {
    return res.status(400).json({
      message: "Only pending bookings can be confirmed",
    });
  }

  // 3. check đúng gia sư
  const currentTutorId = await getTutorIdByUser(req.user!.id);
  if (!currentTutorId || booking.tutorId !== currentTutorId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const tutorId = booking.tutorId!;
  const studentId = booking.studentId;

  // 4. parse slot từ note
  let preferredSlot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null = null;

  try {
    preferredSlot = JSON.parse(booking.noteFromStudent || "{}").preferredSlot;
  } catch {
    preferredSlot = null;
  }

  // booking cũ → duyệt luôn
  if (!preferredSlot) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CONFIRMED },
    });
    return res.json({ message: "Confirmed (legacy booking)" });
  }

  // 5. tính thời gian
  const [h1, m1] = preferredSlot.startTime.split(":").map(Number);
  const [h2, m2] = preferredSlot.endTime.split(":").map(Number);

  const lessonDate = getDateByDayOfWeek(
    new Date(booking.startDateExpected),
    preferredSlot.dayOfWeek
  );

  const start = new Date(lessonDate);
  start.setHours(h1, m1, 0, 0);

  const end = new Date(lessonDate);
  end.setHours(h2, m2, 0, 0);

  // 6. check trùng lịch tutor
  const tutorSchedules = await prisma.schedule.findMany({
    where: { tutorId, status: "ACTIVE" },
  });

  for (const s of tutorSchedules) {
    if (start < s.endTime && end > s.startTime) {
      return res.status(409).json({
        code: "TUTOR_CONFLICT",
        message: "Trùng lịch dạy. Vui lòng huỷ hoặc chọn slot khác.",
      });
    }
  }

  // 7. check trùng lịch student
  const studentSchedules = await prisma.schedule.findMany({
    where: { studentId, status: "ACTIVE" },
  });

  for (const s of studentSchedules) {
    if (start < s.endTime && end > s.startTime) {
      return res.status(400).json({
        message: "Student already has a class at this time",
      });
    }
  }

  // 8. OK → confirm + tạo schedule
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: booking.isTrial ? BookingStatus.TRIAL : BookingStatus.CONFIRMED,
      },
    }),
    prisma.schedule.create({
      data: {
        tutorId,
        studentId,
        bookingId: booking.id,
        startTime: start,
        endTime: end,
      },
    }),
  ]);

  res.json({ message: "Booking confirmed & schedule created" });
});

router.patch("/:id/reject", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = rejectSchema.parse(req.body);
    const bookingId = req.params.id ?? "";

    // Check quyền gia sư
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!tutor)
      return res.status(400).json({ message: "Tutor profile not found" });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tutorId !== tutor.id) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be rejected" });
    }

    // Dùng transaction để đảm bảo xóa sạch schedule nếu có
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật booking
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: payload.reason,
          cancelledBy: CancelledBy.TUTOR,
        },
      });

      // 2. Xóa Schedule (quan trọng: xóa để giải phóng lịch)
      await tx.schedule.deleteMany({
        where: { bookingId: bookingId },
      });

      return b;
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid payload", issues: error.issues });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const cancelSchema = z.object({
  reason: z.string().min(1),
});

router.patch(
  "/:id/cancel",
  authGuard([UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const payload = cancelSchema.parse(req.body);
      const bookingId = req.params.id ?? "";
      if (!bookingId) {
        return res.status(400).json({ message: "Booking id is required" });
      }
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const isFinalized =
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.COMPLETED;
      if (isFinalized) {
        return res.status(400).json({ message: "Booking already finalized" });
      }
      // Nếu đã confirm và không phải lớp thử, không cho hủy
      const isConfirmedNonTrial =
        booking.status === BookingStatus.CONFIRMED && !booking.isTrial;
      if (isConfirmedNonTrial) {
        return res.status(400).json({
          message:
            "Confirmed bookings cannot be cancelled unless it is a trial class",
        });
      }

      let cancelledBy: CancelledBy;
      if (req.user!.role === UserRole.STUDENT) {
        const studentId = await getStudentIdByUser(req.user!.id);
        if (!studentId || booking.studentId !== studentId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        cancelledBy = CancelledBy.STUDENT;
      } else if (req.user!.role === UserRole.TUTOR) {
        const tutorId = await getTutorIdByUser(req.user!.id);
        if (!tutorId || tutorId !== booking.tutorId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        cancelledBy = CancelledBy.TUTOR;
      } else {
        cancelledBy = CancelledBy.SYSTEM;
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: payload.reason,
          cancelledBy,
        },
      });

      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid payload", issues: error.issues });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.patch(
  "/:id/complete",
  authGuard([UserRole.TUTOR, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const bookingId = req.params.id ?? "";

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking)
        return res.status(404).json({ message: "Booking not found" });

      if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.COMPLETED
      ) {
        return res.status(400).json({ message: "Booking already finalized" });
      }

      // Check quyền gia sư
      if (req.user!.role === UserRole.TUTOR) {
        const tutor = await prisma.tutorProfile.findUnique({
          where: { userId: req.user!.id },
        });
        if (!tutor || tutor.id !== booking.tutorId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Transaction: Update Booking + Xóa Schedule
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.COMPLETED },
        });

        // QUAN TRỌNG: Xóa Schedule để tránh hệ thống hiểu nhầm là vẫn đang bận
        await tx.schedule.deleteMany({
          where: { bookingId: booking.id },
        });

        return b;
      });

      // Tính lại chỉ số Tutor
      await recalculateTutorStats(booking.tutorId);

      return res.json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
