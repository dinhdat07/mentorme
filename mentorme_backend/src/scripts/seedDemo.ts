import { PrismaClient, BookingStatus, ClassLifecycleStatus, ClassStatus, UserRole, VerificationStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const VS =
  VerificationStatus ?? {
    UNVERIFIED: "UNVERIFIED",
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  };

const CL =
  ClassLifecycleStatus ?? {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function ensureUser(opts: { email: string; password: string; role: UserRole; fullName: string }) {
  const passwordHash = await hashPassword(opts.password);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { passwordHash, role: opts.role, fullName: opts.fullName },
    create: {
      email: opts.email,
      passwordHash,
      role: opts.role,
      fullName: opts.fullName,
      status: "ACTIVE",
    },
  });
}

async function main() {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== "development" && !process.env.ALLOW_DEMO_SEED) {
    console.warn("Skipping seed: NODE_ENV is not development. Set ALLOW_DEMO_SEED=1 to force.");
    return;
  }

  console.log("Seeding demo data (Phase 1–4B)...");

  // Subjects
  const math = await prisma.subject.upsert({
    where: { name: "Toán 10" },
    update: { level: "K10", description: "Toán lớp 10" },
    create: { name: "Toán 10", level: "K10", description: "Toán lớp 10" },
  });

  // Users
  const admin = await ensureUser({
    email: "admin@mentorme.local",
    password: "Admin@123",
    role: UserRole.ADMIN,
    fullName: "Admin Demo",
  });

  const tutorUser = await ensureUser({
    email: "tutor@mentorme.local",
    password: "Tutor@123",
    role: UserRole.TUTOR,
    fullName: "Gia sư Demo",
  });

  const studentUser = await ensureUser({
    email: "student@mentorme.local",
    password: "Student@123",
    role: UserRole.STUDENT,
    fullName: "Phụ huynh Demo",
  });

  // Profiles
  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      gradeLevel: "10",
      goals: "Ôn tập toán 10",
      preferredSubjects: ["Toán"],
    },
  });

  const tutorProfile = await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {
      verificationStatus: VS.VERIFIED as any,
      verified: true,
      nationalIdNumber: "012345678901",
      nationalIdFrontImageUrl: "https://placehold.co/600x400/front",
      nationalIdBackImageUrl: "https://placehold.co/600x400/back",
      certificatesDetail: [
        { type: "Degree", title: "Cử nhân Toán", issuer: "ĐH Demo", issueDate: "2018-06-01", imageUrl: "https://placehold.co/400x300/degree" },
        { type: "Certificate", title: "Chứng chỉ sư phạm", issuer: "Demo Institute", issueDate: "2019-05-01", imageUrl: "https://placehold.co/400x300/cert" },
      ],
      proofDocuments: {
        studentCard: "https://placehold.co/400x300/student-card",
        transcript: "https://placehold.co/400x300/transcript",
      },
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: new Date(),
      verificationNotes: "Seeded as VERIFIED",
      city: "Hà Nội",
      yearsOfExperience: 5,
      hourlyRateMin: 150000,
      hourlyRateMax: 300000,
      teachingModes: ["ONLINE"],
      trustScore: 4.5,
    },
    create: {
      userId: tutorUser.id,
      bio: "Gia sư Toán 10 với 5 năm kinh nghiệm",
      education: "Cử nhân Toán",
      certificates: [],
      certificatesDetail: [
        { type: "Degree", title: "Cử nhân Toán", issuer: "ĐH Demo", issueDate: "2018-06-01", imageUrl: "https://placehold.co/400x300/degree" },
      ],
      proofDocuments: {
        studentCard: "https://placehold.co/400x300/student-card",
        transcript: "https://placehold.co/400x300/transcript",
      },
      yearsOfExperience: 5,
      hourlyRateMin: 150000,
      hourlyRateMax: 300000,
      teachingModes: ["ONLINE"],
      city: "Hà Nội",
      verificationStatus: VS.VERIFIED as any,
      verified: true,
      nationalIdNumber: "012345678901",
      nationalIdFrontImageUrl: "https://placehold.co/600x400/front",
      nationalIdBackImageUrl: "https://placehold.co/600x400/back",
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: new Date(),
      trustScore: 4.5,
    },
  });

  // Class
  const demoClass = await prisma.class.upsert({
    where: { id: "class-demo-1" },
    update: {
      tutorId: tutorProfile.id,
      subjectId: math.id,
      status: ClassStatus.PUBLISHED,
      lifecycleStatus: CL.ACTIVE as any,
      pricePerHour: 200000,
      isDeleted: false,
      city: "Hà Nội",
      district: "Cầu Giấy",
    },
    create: {
      id: "class-demo-1",
      tutorId: tutorProfile.id,
      subjectId: math.id,
      title: "Toán 10 cơ bản",
      description: "Ôn tập kiến thức Toán 10 và luyện đề",
      pricePerHour: 200000,
      locationType: "ONLINE",
      status: ClassStatus.PUBLISHED,
      lifecycleStatus: CL.ACTIVE as any,
      city: "Hà Nội",
      district: "Cầu Giấy",
    },
  });

  // Booking
  await prisma.booking.upsert({
    where: { id: "booking-demo-1" },
    update: {
      status: BookingStatus.CONFIRMED,
      isTrial: false,
      requestedHoursPerWeek: 3,
      startDateExpected: new Date(),
      noteFromStudent: "Muốn luyện thi cuối kì",
    },
    create: {
      id: "booking-demo-1",
      classId: demoClass.id,
      studentId: studentProfile.id,
      tutorId: tutorProfile.id,
      status: BookingStatus.CONFIRMED,
      isTrial: false,
      requestedHoursPerWeek: 3,
      startDateExpected: new Date(),
      noteFromStudent: "Muốn luyện thi cuối kì",
    },
  });

  // Schedule & Sessions
  const now = new Date();
  const sessions = [
    { start: new Date(now.getTime() - 10 * 60 * 1000), end: new Date(now.getTime() - 1 * 60 * 1000) }, // just happened, still in start window
    { start: new Date(now.getTime() + 30 * 60 * 1000), end: new Date(now.getTime() + 90 * 60 * 1000) }, // later today
    { start: new Date(now.getTime() + 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 25 * 60 * 60 * 1000) }, // tomorrow
    { start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000) }, // +3 days
  ];

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { classId: demoClass.id } });
    await tx.classSchedule.upsert({
      where: { classId: demoClass.id },
      update: {
        timezone: "Asia/Ho_Chi_Minh",
        recurrenceRule: { seeded: true },
        totalSessions: sessions.length,
      },
      create: {
        classId: demoClass.id,
        timezone: "Asia/Ho_Chi_Minh",
        recurrenceRule: { seeded: true },
        totalSessions: sessions.length,
      },
    });
    await tx.session.createMany({
      data: sessions.map((s, idx) => ({
        id: `sess-demo-${idx + 1}`,
        classId: demoClass.id,
        scheduledStartAt: s.start,
        scheduledEndAt: s.end,
        status: "SCHEDULED",
      })),
      skipDuplicates: true,
    });
    await tx.class.update({
      where: { id: demoClass.id },
      data: { totalSessions: sessions.length, sessionsCompleted: 0 },
    });
  });

  // Escrow: deposit for 4 sessions
  const depositAmount = 4 * demoClass.pricePerHour;
  const paymentIntent = await prisma.paymentIntent.upsert({
    where: { id: "pi-demo-1" },
    update: {
      classId: demoClass.id,
      payerId: studentUser.id,
      amount: depositAmount,
      status: "PAID",
      provider: "MOCK",
    },
    create: {
      id: "pi-demo-1",
      classId: demoClass.id,
      payerId: studentUser.id,
      amount: depositAmount,
      status: "PAID",
      provider: "MOCK",
    },
  });

  const escrow = await prisma.escrowAccount.upsert({
    where: { classId: demoClass.id },
    update: {
      totalDeposited: depositAmount,
      availableBalance: depositAmount,
      releasedAmount: 0,
      refundedAmount: 0,
    },
    create: {
      classId: demoClass.id,
      totalDeposited: depositAmount,
      availableBalance: depositAmount,
      releasedAmount: 0,
      refundedAmount: 0,
    },
  });

  const existingDeposit = await prisma.ledgerEntry.findFirst({
    where: { classId: demoClass.id, type: "DEPOSIT", paymentIntentId: paymentIntent.id },
  });
  if (!existingDeposit) {
    await prisma.ledgerEntry.create({
      data: {
        classId: demoClass.id,
        paymentIntentId: paymentIntent.id,
        type: "DEPOSIT",
        amount: depositAmount,
      },
    });
  }

  // Sample notifications
  const notifications = [
    {
      userId: studentUser.id,
      type: "PAYMENT_DEPOSIT_SUCCESS",
      title: "Đã nạp ký quỹ",
      body: "Bạn đã nạp ký quỹ cho lớp Toán 10.",
      dedupKey: "demo:student:deposit",
    },
    {
      userId: tutorUser.id,
      type: "PAYMENT_DEPOSIT_TUTOR",
      title: "Học viên đã nạp ký quỹ",
      body: "Lớp Toán 10 đã được nạp ký quỹ.",
      dedupKey: "demo:tutor:deposit",
    },
    {
      userId: studentUser.id,
      type: "SCHEDULE_CREATED",
      title: "Lịch học đã tạo",
      body: "4 buổi học đã được lên lịch.",
      dedupKey: "demo:student:schedule",
    },
  ];

  for (const n of notifications) {
    try {
      await prisma.notification.create({ data: n as any });
    } catch (err: any) {
      if (err.code !== "P2002") {
        throw err;
      }
    }
  }

  console.log("Seed completed. Admin:", admin.email, "Tutor:", tutorUser.email, "Student:", studentUser.email);
  console.log("Class ID:", demoClass.id, "Escrow available:", escrow.availableBalance);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
