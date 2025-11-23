import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { UserRole } from "@prisma/client";

const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });

describe("Student profile routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns current student profile", async () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({
      id: "student-1",
      userId: "user-student",
      gradeLevel: "Lớp 9",
      preferredSubjects: [],
    } as any);

    const res = await request(app)
      .get("/api/students/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "student-1", gradeLevel: "Lớp 9" });
  });

  test("updates student profile", async () => {
    mockPrisma.studentProfile.update.mockResolvedValue({
      id: "student-1",
      userId: "user-student",
      gradeLevel: "Lớp 10",
      preferredSubjects: ["math"],
    } as any);

    const res = await request(app)
      .patch("/api/students/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ gradeLevel: "Lớp 10", preferredSubjects: ["math"] });

    expect(res.status).toBe(200);
    expect(mockPrisma.studentProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gradeLevel: "Lớp 10" }),
      })
    );
  });
});
