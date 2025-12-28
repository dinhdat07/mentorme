import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { BookingStatus, UserRole, UserStatus } from "@prisma/client";

const BOOKING_ID = "33333333-3333-4333-8333-333333333333";
const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });
const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });
const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });

describe("Booking and admin routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("tutor confirms booking", async () => {
    mockPrisma.tutorProfile.findUnique
      .mockResolvedValueOnce({ id: "tutor-1", userId: "user-tutor" } as any) // getTutorIdByUser
      .mockResolvedValueOnce({ id: "tutor-1", verificationStatus: "VERIFIED" } as any); // ensureTutorVerified
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tutorId: "tutor-1",
      status: BookingStatus.PENDING,
      isTrial: false,
    } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValueOnce({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    } as any);
    mockPrisma.booking.update.mockResolvedValue({ id: BOOKING_ID, status: BookingStatus.CONFIRMED } as any);

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING_ID}/confirm`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).toHaveBeenCalled();
  });

  test("unverified tutor cannot confirm booking", async () => {
    mockPrisma.tutorProfile.findUnique
      .mockResolvedValueOnce({ id: "tutor-1", userId: "user-tutor" } as any) // getTutorIdByUser
      .mockResolvedValueOnce({ id: "tutor-1", verificationStatus: "PENDING" } as any); // ensureTutorVerified
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tutorId: "tutor-1",
      status: BookingStatus.PENDING,
      isTrial: false,
    } as any);

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING_ID}/confirm`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  test("student cancels booking", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tutorId: "tutor-1",
      studentId: "student-1",
      status: BookingStatus.PENDING,
      isTrial: false,
    } as any);
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" });
    mockPrisma.booking.update.mockResolvedValue({ id: BOOKING_ID, status: BookingStatus.CANCELLED } as any);

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING_ID}/cancel`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ reason: "Change" });

    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).toHaveBeenCalled();
  });

  test("unverified tutor cannot complete booking", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tutorId: "tutor-1",
      studentId: "student-1",
      status: BookingStatus.PENDING,
      isTrial: false,
    } as any);
    mockPrisma.tutorProfile.findUnique
      .mockResolvedValueOnce({ id: "tutor-1", userId: "user-tutor" } as any) // getTutorIdByUser
      .mockResolvedValueOnce({ id: "tutor-1", verificationStatus: "PENDING" } as any); // ensureTutorVerified

    const res = await request(app)
      .patch(`/api/bookings/${BOOKING_ID}/complete`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(403);
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  test("admin verifies tutor and lists bookings", async () => {
    mockPrisma.tutorProfile.findUnique
      .mockResolvedValueOnce({
        id: "tutor-1",
        userId: "user-tutor",
        verificationStatus: "PENDING",
      } as any) // verify route fetch
      .mockResolvedValueOnce({
        id: "tutor-1",
        userId: "user-tutor",
        verificationStatus: "VERIFIED",
      } as any); // ensureTutorVerified follow-ups if any
    mockPrisma.user.update.mockResolvedValue({ status: "ACTIVE" } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({
      id: "tutor-1",
      verificationStatus: "VERIFIED",
    } as any);
    mockPrisma.$transaction.mockImplementation(async (actions: any[]) => {
      return Promise.all(actions.map((fn) => fn));
    });

    const verifyRes = await request(app)
      .patch("/api/admin/tutors/tutor-1/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ approved: true });
    expect(verifyRes.status).toBe(200);

    mockPrisma.booking.findMany.mockResolvedValue([]);
    const bookingList = await request(app)
      .get("/api/admin/bookings")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(bookingList.status).toBe(200);
  });

  test("admin bans tutor and student", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor" });
    mockPrisma.user.update.mockResolvedValue({ status: UserStatus.SUSPENDED });
    mockPrisma.class.updateMany.mockResolvedValue({ count: 0 } as any);

    const banTutor = await request(app)
      .patch("/api/admin/tutors/tutor-1/ban")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ banned: true });
    expect(banTutor.status).toBe(200);

    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" });
    const banStudent = await request(app)
      .patch("/api/admin/students/student-1/ban")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ banned: true });
    expect(banStudent.status).toBe(200);
  });
});
