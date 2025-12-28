import {
  Class,
  LedgerType,
  PaymentStatus,
  PrismaClient,
  Session,
} from "@prisma/client";
import { createNotification } from "./notifications";

const PS =
  PaymentStatus ?? {
    PENDING: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
  };

const LT =
  LedgerType ?? {
    DEPOSIT: "DEPOSIT",
    RELEASE_TO_TUTOR: "RELEASE_TO_TUTOR",
    PLATFORM_FEE: "PLATFORM_FEE",
    REFUND: "REFUND",
  };

export type DepositIntentInput = {
  classId: string;
  payerId: string;
  packageSessionsCount: number;
  amountPerSession: number;
  currency?: string;
};

export async function createDepositIntent(prisma: PrismaClient, input: DepositIntentInput) {
  const totalAmount = input.packageSessionsCount * input.amountPerSession;
  return prisma.paymentIntent.create({
    data: {
      classId: input.classId,
      payerId: input.payerId,
      amount: totalAmount,
      currency: input.currency || "VND",
      status: PS.PENDING as any,
      provider: "MOCK",
    },
  });
}

export async function confirmPaymentIntent(prisma: PrismaClient, intentId: string) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
  });
  if (!intent) {
    throw Object.assign(new Error("Payment intent not found"), { status: 404 });
  }

  if (intent.status === PS.PAID) {
    const escrow = await prisma.escrowAccount.findUnique({ where: { classId: intent.classId } });
    return { intent, escrow };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedIntent = await tx.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PS.PAID as any, providerRef: "MOCK_OK" },
    });

    const escrow = await tx.escrowAccount.upsert({
      where: { classId: intent.classId },
      update: {
        totalDeposited: { increment: intent.amount },
        availableBalance: { increment: intent.amount },
      },
      create: {
        classId: intent.classId,
        totalDeposited: intent.amount,
        availableBalance: intent.amount,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        classId: intent.classId,
        paymentIntentId: intent.id,
        type: LT.DEPOSIT as any,
        amount: intent.amount,
      },
    });

    return { intent: updatedIntent, escrow };
  });

  const classListing = await prisma.class.findUnique({
    where: { id: intent.classId },
    include: { tutor: { select: { userId: true } } },
  });
  const tutorUserId = classListing?.tutor?.userId;
  const payerId = intent.payerId;

  await createNotification(prisma, {
    userId: payerId,
    type: "PAYMENT_DEPOSIT_SUCCESS",
    title: "Nạp tiền thành công",
    body: "Thanh toán giả lập đã được ghi nhận vào tài khoản ký quỹ.",
    metadata: { classId: intent.classId, paymentIntentId: intent.id },
    dedupKey: `payment:${intent.id}:payer`,
  });
  if (tutorUserId) {
    await createNotification(prisma, {
      userId: tutorUserId,
      type: "PAYMENT_DEPOSIT_TUTOR",
      title: "Học viên đã nạp tiền ký quỹ",
      body: "Lớp của bạn đã được nạp tiền ký quỹ.",
      metadata: { classId: intent.classId, paymentIntentId: intent.id },
      dedupKey: `payment:${intent.id}:tutor`,
    });
  }

  return result;
}

export async function getEscrowSummary(
  prisma: PrismaClient,
  classId: string,
  opts: { take?: number; skip?: number } = {}
) {
  const escrow =
    (await prisma.escrowAccount.findUnique({ where: { classId } })) ??
    ({
      classId,
      totalDeposited: 0,
      availableBalance: 0,
      releasedAmount: 0,
      refundedAmount: 0,
    } as any);

  const ledger = await prisma.ledgerEntry.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
    skip: opts.skip ?? 0,
    take: opts.take ?? 20,
  });

  const paidReleases = ledger.filter((l) => l.type === LT.RELEASE_TO_TUTOR && l.sessionId).map((l) => l.sessionId);

  return { escrow, ledger, paidReleases };
}

async function getPayerIds(prisma: PrismaClient, classId: string): Promise<string[]> {
  const intents = await prisma.paymentIntent.findMany({
    where: { classId, status: PS.PAID as any },
    select: { payerId: true },
  });
  return Array.from(new Set(intents.map((i) => i.payerId)));
}

export type ReleaseResult =
  | { released: true; tutorAmount: number; feeAmount: number }
  | { released: false; reason: string };

export async function releaseForCompletedSession(prisma: PrismaClient, sessionId: string): Promise<ReleaseResult> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { class: { include: { tutor: { select: { userId: true } } } } },
  });
  if (!session || !session.class) {
    return { released: false, reason: "not_found" };
  }
  if ((session as any).status && (session as any).status !== "COMPLETED") {
    return { released: false, reason: "not_completed" };
  }
  if (session.disputeFlaggedAt) {
    return { released: false, reason: "disputed" };
  }
  const sessionPrice = (session.class as Class).pricePerHour ?? 0;
  if (!sessionPrice || sessionPrice <= 0) {
    return { released: false, reason: "no_price" };
  }

  const payerIds = await getPayerIds(prisma, session.classId);
  const tutorUserId = (session.class as any).tutor?.userId as string | undefined;

  const txnResult = await prisma.$transaction(async (tx) => {
    const alreadyPaid = await tx.ledgerEntry.findFirst({
      where: { sessionId: session.id, type: LT.RELEASE_TO_TUTOR as any },
    });
    if (alreadyPaid) {
      return { released: false, reason: "already_paid" } as ReleaseResult;
    }

    const escrow = await tx.escrowAccount.findUnique({ where: { classId: session.classId } });
    if (!escrow || escrow.availableBalance < sessionPrice) {
      return { released: false, reason: "insufficient" } as ReleaseResult;
    }

    const tutorAmount = Number((sessionPrice * 0.9).toFixed(2));
    const feeAmount = Number((sessionPrice - tutorAmount).toFixed(2));

    await tx.escrowAccount.update({
      where: { classId: session.classId },
      data: {
        availableBalance: { decrement: sessionPrice },
        releasedAmount: { increment: tutorAmount },
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          classId: session.classId,
          sessionId: session.id,
          type: LT.RELEASE_TO_TUTOR as any,
          amount: tutorAmount,
        },
        {
          classId: session.classId,
          sessionId: session.id,
          type: LT.PLATFORM_FEE as any,
          amount: feeAmount,
        },
      ],
    });

    return { released: true, tutorAmount, feeAmount } as ReleaseResult;
  });

  if (!txnResult.released && txnResult.reason === "insufficient" && payerIds.length > 0) {
    for (const pid of payerIds) {
      await createNotification(prisma, {
        userId: pid,
        type: "ESCROW_INSUFFICIENT",
        title: "Ký quỹ chưa đủ",
        body: "Số dư ký quỹ không đủ để thanh toán buổi học đã hoàn thành. Vui lòng nạp thêm.",
        metadata: { sessionId: session.id, classId: session.classId },
        dedupKey: `escrow:insufficient:${session.id}:${pid}`,
      });
    }
  }

  if (txnResult.released) {
    const recipients = [...payerIds, tutorUserId].filter(Boolean) as string[];
    for (const uid of recipients) {
      await createNotification(prisma, {
        userId: uid,
        type: "PAYMENT_RELEASED",
        title: "Thanh toán đã được giải ngân",
        body: "Thanh toán cho buổi học đã được chuyển từ ký quỹ.",
        metadata: { sessionId: session.id, classId: session.classId },
        dedupKey: `escrow:released:${session.id}:${uid}`,
      });
    }
  }

  return txnResult;
}

export async function refundEscrow(prisma: PrismaClient, classId: string) {
  const payerIds = await getPayerIds(prisma, classId);
  const tutorUserId = (
    await prisma.class.findUnique({ where: { id: classId }, include: { tutor: { select: { userId: true } } } })
  )?.tutor?.userId;

  const result = await prisma.$transaction(async (tx) => {
    const escrow = await tx.escrowAccount.findUnique({ where: { classId } });
    const amount = escrow?.availableBalance ?? 0;
    if (!escrow || amount <= 0) {
      return { refunded: false, amount: 0 };
    }
    await tx.escrowAccount.update({
      where: { classId },
      data: {
        availableBalance: 0,
        refundedAmount: { increment: amount },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        classId,
        type: LT.REFUND as any,
        amount,
      },
    });

    await tx.paymentIntent.updateMany({
      where: { classId, status: PS.PAID as any },
      data: { status: PS.REFUNDED as any },
    });

    return { refunded: true, amount };
  });

  if (result.refunded) {
    for (const pid of payerIds) {
      await createNotification(prisma, {
        userId: pid,
        type: "PAYMENT_REFUNDED",
        title: "Hoàn tiền ký quỹ",
        body: "Số dư ký quỹ của lớp đã được hoàn trả.",
        metadata: { classId },
        dedupKey: `escrow:refunded:${classId}:${pid}`,
      });
    }
    if (tutorUserId) {
      await createNotification(prisma, {
        userId: tutorUserId,
        type: "PAYMENT_REFUNDED_TUTOR",
        title: "Lớp đã được hoàn tiền ký quỹ",
        body: "Lớp học đã bị hủy và ký quỹ đã được hoàn.",
        metadata: { classId },
        dedupKey: `escrow:refunded:${classId}:${tutorUserId}`,
      });
    }
  }

  return result;
}
