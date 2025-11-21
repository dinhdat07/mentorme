import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { ClassStatus, LocationType, UserRole } from "@prisma/client";

const SUBJECT_ID = "11111111-1111-4111-8111-111111111111";
const CLASS_ID = "22222222-2222-4222-8222-222222222222";

const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });
const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });

describe("Tutor profile and class routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates tutor profile", async () => {
    const tutorProfile = { id: "tutor-1", userId: "user-tutor" } as any;
    mockPrisma.tutorProfile.update.mockResolvedValue({ ...tutorProfile, bio: "Updated" });

    const res = await request(app)
      .patch("/api/tutors/me")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ bio: "Updated" });

    expect(res.status).toBe(200);
    expect(mockPrisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bio: "Updated" }) })
    );
  });

  test("creates class listing", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor" });
    mockPrisma.subject.findUnique.mockResolvedValue({ id: SUBJECT_ID } as any);
    mockPrisma.class.create.mockResolvedValue({
      id: CLASS_ID,
      tutorId: "tutor-1",
      subjectId: SUBJECT_ID,
      title: "Math",
      description: "Basics",
      pricePerHour: 200000,
      locationType: LocationType.ONLINE,
      status: ClassStatus.DRAFT,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .post("/api/classes")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        subjectId: SUBJECT_ID,
        title: "Math",
        description: "Basics",
        pricePerHour: 200000,
        locationType: "ONLINE",
      });

    expect(res.status).toBe(201);
    expect(mockPrisma.class.create).toHaveBeenCalled();
  });

  test("admin lists classes", async () => {
    mockPrisma.class.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/admin/classes")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
