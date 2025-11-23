import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { BookingStatus, ClassStatus, LocationType, UserRole } from "@prisma/client";

const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });
const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });
const CLASS_ID = "22222222-2222-4222-8222-222222222222";

describe("Class routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates class status as tutor", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      tutorId: "tutor-1",
      isDeleted: false,
      status: ClassStatus.DRAFT,
    } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor" });
    mockPrisma.class.update.mockResolvedValue({ id: CLASS_ID, status: ClassStatus.PUBLISHED } as any);

    const res = await request(app)
      .patch(`/api/classes/${CLASS_ID}/status`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({ status: "PUBLISHED" });

    expect(res.status).toBe(200);
    expect(mockPrisma.class.update).toHaveBeenCalled();
  });

  test("prevents delete when class not archived", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      tutorId: "tutor-1",
      isDeleted: false,
      status: ClassStatus.PUBLISHED,
    } as any);
    const res = await request(app)
      .delete(`/api/classes/${CLASS_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("returns students in class for tutor", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      tutorId: "tutor-1",
      isDeleted: false,
      status: ClassStatus.PUBLISHED,
    } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor" });
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: "b1", status: BookingStatus.CONFIRMED, student: { id: "s1" } },
    ] as any);

    const res = await request(app)
      .get(`/api/classes/${CLASS_ID}/students`)
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: "b1" })]));
  });

  test("fetches public class detail", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      tutorId: "tutor-1",
      isDeleted: false,
      status: ClassStatus.PUBLISHED,
      subject: {},
      tutor: {},
      title: "Toán",
      pricePerHour: 200000,
      locationType: LocationType.ONLINE,
    } as any);

    const res = await request(app).get(`/api/classes/${CLASS_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title", "Toán");
  });
});
