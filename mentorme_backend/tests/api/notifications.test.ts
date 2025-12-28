import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { UserRole } from "@prisma/client";

const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });
const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });

describe("Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("verification approve creates notification", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      userId: "user-tutor",
      verificationStatus: "PENDING",
    } as any);
    mockPrisma.user.update.mockResolvedValue({ status: "ACTIVE" } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({ id: "t1" } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" } as any);

    const res = await request(app)
      .patch("/api/admin/tutor-verifications/t1/approve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  test("session start one-sided notifies other", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T10:05:00.000Z"));
    mockPrisma.session.findUnique.mockResolvedValue({
      id: "s1",
      classId: "c1",
      scheduledStartAt: new Date("2025-01-01T10:00:00.000Z"),
      scheduledEndAt: new Date("2025-01-01T11:00:00.000Z"),
      status: "SCHEDULED",
      class: {
        tutorId: "t1",
        tutor: { id: "t1", userId: "user-tutor", verificationStatus: "VERIFIED" },
        bookings: [{ student: { id: "stu1", userId: "user-student" } }],
      },
    } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "t1", userId: "user-tutor", verificationStatus: "VERIFIED" } as any);
    mockPrisma.session.update.mockResolvedValue({
      id: "s1",
      status: "SCHEDULED",
      tutorStartConfirmedAt: new Date(),
    } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" } as any);

    const res = await request(app)
      .patch("/api/sessions/s1/start")
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-student" }),
      })
    );
    jest.useRealTimers();
  });

  test("notification list and mark read", async () => {
    const token = signToken({ userId: "u1", role: UserRole.TUTOR });
    mockPrisma.notification.findMany.mockResolvedValue([{ id: "n1", userId: "u1" } as any]);
    mockPrisma.notification.count.mockResolvedValue(1 as any);
    mockPrisma.notification.update.mockResolvedValue({ id: "n1", readAt: new Date() } as any);
    mockPrisma.notification.findUnique.mockResolvedValue({ id: "n1", userId: "u1" } as any);

    const list = await request(app).get("/api/notifications/me").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    const read = await request(app).patch("/api/notifications/n1/read").set("Authorization", `Bearer ${token}`);
    expect(read.status).toBe(200);
  });
});
