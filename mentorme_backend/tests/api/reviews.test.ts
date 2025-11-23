import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { BookingStatus, UserRole } from "@prisma/client";

const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });

describe("Review routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates review when booking completed", async () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" });
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      studentId: "student-1",
      tutorId: "tutor-1",
      status: BookingStatus.COMPLETED,
    } as any);
    mockPrisma.review.create.mockResolvedValue({
      id: "review-1",
      bookingId: "booking-1",
      tutorId: "tutor-1",
      rating: 5,
    } as any);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
    mockPrisma.booking.count.mockResolvedValue(1);
    mockPrisma.tutorProfile.update.mockResolvedValue({ id: "tutor-1" } as any);

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ bookingId: "11111111-1111-4111-8111-111111111111", rating: 5 });

    expect(res.status).toBe(201);
    expect(mockPrisma.review.create).toHaveBeenCalled();
    expect(mockPrisma.tutorProfile.update).toHaveBeenCalled();
  });

  test("rejects review when booking not completed", async () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" });
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      studentId: "student-1",
      tutorId: "tutor-1",
      status: BookingStatus.PENDING,
    } as any);

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ bookingId: "booking-1", rating: 5 });

    expect(res.status).toBe(400);
  });
});
