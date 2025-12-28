import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { ClassStatus, UserStatus } from "@prisma/client";
const VerificationStatus = {
  VERIFIED: "VERIFIED",
  PENDING: "PENDING",
};

describe("Tutor visibility rules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("unverified tutor is excluded from search results", async () => {
    mockPrisma.tutorProfile.findMany.mockResolvedValue([
      {
        id: "v1",
        verificationStatus: VerificationStatus.VERIFIED as any,
        user: { status: UserStatus.ACTIVE },
        trustScore: 50,
        averageRating: 4.2,
        totalCompletedBookings: 5,
        classes: [
          {
            id: "c1",
            subjectId: "s1",
            pricePerHour: 200000,
            targetGrade: "Lop 9",
            status: ClassStatus.PUBLISHED,
            isDeleted: false,
          },
        ],
      },
      {
        id: "u1",
        verificationStatus: VerificationStatus.PENDING as any,
        user: { status: UserStatus.ACTIVE },
        trustScore: 70,
        averageRating: 4.8,
        totalCompletedBookings: 8,
        classes: [
          {
            id: "c2",
            subjectId: "s1",
            pricePerHour: 150000,
            targetGrade: "Lop 9",
            status: ClassStatus.PUBLISHED,
            isDeleted: false,
          },
        ],
      },
    ] as any);
    mockPrisma.tutorProfile.count.mockResolvedValue(2 as any);

    const res = await request(app).get("/api/tutors?subjectId=11111111-1111-4111-8111-111111111111");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.find((t: any) => t.id === "u1")).toBeUndefined();
    expect(res.body.data.find((t: any) => t.id === "v1")).toBeDefined();
  });
});
