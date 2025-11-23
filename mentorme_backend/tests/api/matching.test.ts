import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { ClassStatus, UserStatus } from "@prisma/client";

describe("Matching routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns tutors ordered by matchScore with filters applied", async () => {
    mockPrisma.tutorProfile.findMany.mockResolvedValue([
      {
        id: "t1",
        verified: true,
        user: { status: UserStatus.ACTIVE },
        trustScore: 60,
        averageRating: 4.5,
        totalCompletedBookings: 10,
        classes: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            subjectId: "22222222-2222-4222-8222-222222222222",
            pricePerHour: 200000,
            targetGrade: "Lớp 9",
            status: ClassStatus.PUBLISHED,
            isDeleted: false,
          },
        ],
      },
      {
        id: "t2",
        verified: true,
        user: { status: UserStatus.ACTIVE },
        trustScore: 80,
        averageRating: 4.0,
        totalCompletedBookings: 5,
        classes: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            subjectId: "22222222-2222-4222-8222-222222222222",
            pricePerHour: 260000,
            targetGrade: "Lớp 9",
            status: ClassStatus.PUBLISHED,
            isDeleted: false,
          },
        ],
      },
    ] as any);

    const res = await request(app).get(
      "/api/matching/tutors?subjectId=22222222-2222-4222-8222-222222222222&priceMin=150000&priceMax=250000&gradeLevel=Lop%209"
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.tutorProfile.findMany).toHaveBeenCalled();
    // Should be sorted by matchScore descending; tutor with closer price and higher rating should lead
    expect(res.body[0].tutor.id).toBe("t1");
  });
});
