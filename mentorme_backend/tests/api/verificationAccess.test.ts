import request from "supertest";
import app from "../../src/app";
import { signToken } from "../../src/utils/jwt";
import { mockPrisma } from "../utils/mockPrisma";
import { UserRole, UserStatus, ClassStatus } from "@prisma/client";
const VerificationStatus = {
  VERIFIED: "VERIFIED",
  PENDING: "PENDING",
};

const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });
const studentToken = signToken({ userId: "student", role: UserRole.STUDENT });
const tutorToken = signToken({ userId: "tutor", role: UserRole.TUTOR });

describe("Verification access & leakage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("non-admin cannot access admin verification list", async () => {
    const res = await request(app)
      .get("/api/admin/tutor-verifications")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test("duplicate CCCD returns 409", async () => {
    mockPrisma.tutorProfile.findUnique
      .mockResolvedValueOnce({ id: "t1", verificationStatus: VerificationStatus.UNVERIFIED } as any) // userId lookup
      .mockResolvedValueOnce({ id: "t1", verificationStatus: VerificationStatus.UNVERIFIED } as any); // service lookup
    const error: any = new Error("Unique constraint");
    error.code = "P2002";
    mockPrisma.tutorProfile.update.mockRejectedValue(error);
    const res = await request(app)
      .put("/api/tutors/me/verification")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        nationalIdNumber: "123456789",
        nationalIdFrontImageUrl: "https://front",
        nationalIdBackImageUrl: "https://back",
      });
    expect(res.status).toBe(409);
  });

  test("public search masks PII", async () => {
    mockPrisma.tutorProfile.findMany.mockResolvedValue([
      {
        id: "t1",
        verificationStatus: VerificationStatus.VERIFIED,
        user: { status: UserStatus.ACTIVE, fullName: "Tutor 1" },
        nationalIdNumber: "123456789",
        nationalIdFrontImageUrl: "secret-front",
        proofDocuments: { studentCardUrl: "secret" },
        classes: [
          {
            id: "c1",
            subjectId: "s1",
            pricePerHour: 200000,
            status: ClassStatus.PUBLISHED,
            isDeleted: false,
            targetGrade: "9",
          },
        ],
        trustScore: 10,
        averageRating: 5,
        totalCompletedBookings: 0,
      },
    ] as any);
    mockPrisma.tutorProfile.count.mockResolvedValue(1 as any);

    const res = await request(app).get("/api/tutors?subjectId=11111111-1111-4111-8111-111111111111");
    expect(res.status).toBe(200);
    const tutor = res.body.data[0];
    expect(tutor.nationalIdNumber).toMatch(/\*+6789/);
    expect(tutor.nationalIdFrontImageUrl).toBeUndefined();
    expect(tutor.proofDocuments).toBeUndefined();
  });
});
