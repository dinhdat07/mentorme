import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { UserRole } from "@prisma/client";

const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });
const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });
const SESSION_ID = "sess-1";

const baseSession = {
  id: SESSION_ID,
  classId: "class-1",
  scheduledStartAt: new Date("2025-01-01T10:00:00.000Z"),
  scheduledEndAt: new Date("2025-01-01T11:00:00.000Z"),
  status: "SCHEDULED",
  tutorStartConfirmedAt: null,
  studentStartConfirmedAt: null,
  tutorCompleteConfirmedAt: null,
  studentCompleteConfirmedAt: null,
  startedAt: null,
  completedAt: null,
  disputeFlaggedAt: null,
};

const classWithRelations = {
  id: "class-1",
  tutorId: "tutor-1",
  totalSessions: 2,
  sessionsCompleted: 0,
  lifecycleStatus: "ACTIVE",
  tutor: { id: "tutor-1", verificationStatus: "VERIFIED" },
  bookings: [{ studentId: "student-1", status: "CONFIRMED" }],
};

describe("Session lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T10:05:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockSessionFetch = (sessionOverrides: any = {}) => {
    mockPrisma.session.findUnique.mockResolvedValue({
      ...baseSession,
      ...sessionOverrides,
      class: sessionOverrides.class ?? classWithRelations,
    } as any);
  };

  const mockTutorProfile = () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor", verificationStatus: "VERIFIED" } as any);
  };

  const mockStudentProfile = () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" } as any);
  };

  test("tutor start confirmation only keeps session scheduled", async () => {
    mockSessionFetch();
    mockTutorProfile();
    mockPrisma.session.update.mockResolvedValue({ ...baseSession, tutorStartConfirmedAt: new Date(), status: "SCHEDULED" } as any);

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/start`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tutorStartConfirmedAt: expect.any(Date) }),
      })
    );
    expect(res.body.status).toBe("SCHEDULED");
  });

  test("both start confirmations move to IN_PROGRESS", async () => {
    mockSessionFetch({ studentStartConfirmedAt: new Date("2025-01-01T10:00:00.000Z") });
    mockTutorProfile();
    mockPrisma.session.update.mockResolvedValue({ ...baseSession, tutorStartConfirmedAt: new Date(), studentStartConfirmedAt: new Date("2025-01-01T10:00:00.000Z"), status: "IN_PROGRESS", startedAt: new Date() } as any);

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/start`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
    expect(res.body.startedAt).toBeDefined();
  });

  test("complete by both transitions to COMPLETED and increments class progress", async () => {
    jest.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
    mockSessionFetch({
      status: "IN_PROGRESS",
      tutorStartConfirmedAt: new Date("2025-01-01T10:05:00.000Z"),
      studentStartConfirmedAt: new Date("2025-01-01T10:06:00.000Z"),
      studentCompleteConfirmedAt: new Date("2025-01-01T11:40:00.000Z"),
    });
    mockTutorProfile();
    mockPrisma.session.update.mockResolvedValue({ ...baseSession, status: "COMPLETED", tutorCompleteConfirmedAt: new Date(), studentCompleteConfirmedAt: new Date(), completedAt: new Date() } as any);
    mockPrisma.class.update.mockResolvedValue({ id: "class-1", sessionsCompleted: 1, totalSessions: 2 } as any);
    mockPrisma.class.findUnique.mockResolvedValue({ id: "class-1", sessionsCompleted: 1, totalSessions: 2 } as any);
    mockPrisma.$transaction.mockResolvedValue({ ...baseSession, status: "COMPLETED" } as any);

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/complete`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });

  test("start outside window is rejected", async () => {
    jest.setSystemTime(new Date("2025-01-01T08:00:00.000Z"));
    mockSessionFetch();
    mockTutorProfile();

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/start`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
  });

  test("unauthorized user cannot confirm", async () => {
    mockSessionFetch({ class: { ...classWithRelations, bookings: [] } });
    mockStudentProfile();

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/start`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  test("dispute is flagged after 6h gap on completion", async () => {
    jest.setSystemTime(new Date("2025-01-01T18:30:00.000Z"));
    mockSessionFetch({
      status: "IN_PROGRESS",
      tutorStartConfirmedAt: new Date("2025-01-01T10:00:00.000Z"),
      studentStartConfirmedAt: new Date("2025-01-01T10:00:00.000Z"),
      tutorCompleteConfirmedAt: new Date("2025-01-01T11:30:00.000Z"),
      scheduledEndAt: new Date("2025-01-01T12:00:00.000Z"),
    });
    mockStudentProfile();
    mockPrisma.session.update.mockResolvedValue({
      ...baseSession,
      tutorCompleteConfirmedAt: new Date("2025-01-01T11:30:00.000Z"),
      studentCompleteConfirmedAt: new Date(),
      disputeFlaggedAt: new Date(),
      status: "IN_PROGRESS",
    } as any);
    mockPrisma.class.update.mockResolvedValue({ id: "class-1" } as any);
    mockPrisma.class.findUnique.mockResolvedValue({ id: "class-1", sessionsCompleted: 0, totalSessions: 2 } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" } as any);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockResolvedValue({
      ...baseSession,
      disputeFlaggedAt: new Date(),
      status: "IN_PROGRESS",
    } as any);

    const res = await request(app)
      .patch(`/api/sessions/${SESSION_ID}/complete`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.disputeFlaggedAt).toBeDefined();
  });
});
