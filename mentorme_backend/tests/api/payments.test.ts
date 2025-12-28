import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { UserRole } from "@prisma/client";
import { releaseForCompletedSession, refundEscrow } from "../../src/services/escrow";

const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });
const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });

describe("Escrow payments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("create and confirm deposit intent updates escrow and ledger", async () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "stu1", userId: "user-student" } as any);
    mockPrisma.class.findUnique.mockResolvedValue({
      id: "class-1",
      tutorId: "tutor-1",
      pricePerHour: 100000,
      isDeleted: false,
      tutor: { userId: "user-tutor" },
    } as any);
    mockPrisma.classSchedule.findUnique.mockResolvedValue({ id: "sched1", classId: "class-1" } as any);
    mockPrisma.booking.findFirst.mockResolvedValue({ id: "bk1", studentId: "stu1", status: "CONFIRMED" } as any);
    mockPrisma.paymentIntent.create.mockResolvedValue({
      id: "pi1",
      classId: "class-1",
      payerId: "user-student",
      amount: 400000,
      status: "PENDING",
    } as any);

    const createRes = await request(app)
      .post("/api/classes/class-1/payments/intents")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ packageSessionsCount: 4, amountPerSession: 100000 });

    expect(createRes.status).toBe(201);
    expect(mockPrisma.paymentIntent.create).toHaveBeenCalled();

    mockPrisma.paymentIntent.findUnique.mockResolvedValue({
      id: "pi1",
      classId: "class-1",
      payerId: "user-student",
      amount: 400000,
      status: "PENDING",
    } as any);
    mockPrisma.paymentIntent.update.mockResolvedValue({
      id: "pi1",
      classId: "class-1",
      payerId: "user-student",
      amount: 400000,
      status: "PAID",
    } as any);
    mockPrisma.escrowAccount.upsert.mockResolvedValue({
      id: "esc1",
      classId: "class-1",
      totalDeposited: 400000,
      availableBalance: 400000,
      releasedAmount: 0,
      refundedAmount: 0,
    } as any);
    mockPrisma.ledgerEntry.create.mockResolvedValue({ id: "led1" } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "noti1" } as any);

    const confirmRes = await request(app)
      .post("/api/payments/pi1/confirm")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(confirmRes.status).toBe(200);
    expect(mockPrisma.ledgerEntry.create).toHaveBeenCalled();
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  test("release for completed session uses escrow balance and creates ledger", async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: "sess-1",
      classId: "class-1",
      disputeFlaggedAt: null,
      class: { id: "class-1", pricePerHour: 100000, tutor: { userId: "user-tutor" } },
    } as any);
    mockPrisma.paymentIntent.findMany.mockResolvedValue([{ payerId: "user-student" }] as any);
    mockPrisma.ledgerEntry.findFirst.mockResolvedValue(null as any);
    mockPrisma.escrowAccount.findUnique.mockResolvedValue({
      classId: "class-1",
      availableBalance: 200000,
    } as any);
    mockPrisma.escrowAccount.update.mockResolvedValue({} as any);
    mockPrisma.ledgerEntry.createMany.mockResolvedValue({} as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" } as any);

    const result = await releaseForCompletedSession(mockPrisma as any, "sess-1");
    expect(result.released).toBe(true);
    expect(mockPrisma.ledgerEntry.createMany).toHaveBeenCalled();
  });

  test("insufficient escrow triggers notification and no release", async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: "sess-2",
      classId: "class-1",
      disputeFlaggedAt: null,
      class: { id: "class-1", pricePerHour: 100000, tutor: { userId: "user-tutor" } },
    } as any);
    mockPrisma.paymentIntent.findMany.mockResolvedValue([{ payerId: "user-student" }] as any);
    mockPrisma.ledgerEntry.findFirst.mockResolvedValue(null as any);
    mockPrisma.escrowAccount.findUnique.mockResolvedValue({
      classId: "class-1",
      availableBalance: 50000,
    } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n2" } as any);

    const result = await releaseForCompletedSession(mockPrisma as any, "sess-2");
    expect(result.released).toBe(false);
    expect((result as any).reason).toBe("insufficient");
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  test("refundEscrow returns remaining balance and creates ledger", async () => {
    mockPrisma.paymentIntent.findMany.mockResolvedValue([{ payerId: "user-student" }] as any);
    mockPrisma.class.findUnique.mockResolvedValue({
      id: "class-1",
      tutor: { userId: "user-tutor" },
    } as any);
    mockPrisma.escrowAccount.findUnique.mockResolvedValue({
      classId: "class-1",
      availableBalance: 120000,
    } as any);
    mockPrisma.escrowAccount.update.mockResolvedValue({} as any);
    mockPrisma.ledgerEntry.create.mockResolvedValue({ id: "led-refund" } as any);
    mockPrisma.paymentIntent.updateMany.mockResolvedValue({} as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "noti-refund" } as any);

    const result = await refundEscrow(mockPrisma as any, "class-1");
    expect(result.refunded).toBe(true);
    expect(mockPrisma.ledgerEntry.create).toHaveBeenCalled();
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });
});
