import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { hashPassword } from "../../src/utils/password";
import { signToken } from "../../src/utils/jwt";
import { UserRole, UserStatus } from "@prisma/client";

describe("Auth API", () => {
  test("registers a new student", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const userRecord = {
      id: "user-1",
      fullName: "Student One",
      email: "student@example.com",
      phone: "123456789",
      passwordHash: "hash",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(userRecord);
    mockPrisma.studentProfile.create.mockResolvedValue({
      id: "student-1",
      userId: "user-1",
      gradeLevel: "Unknown",
      goals: null,
      preferredSubjects: [],
      notes: null,
    });

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Student One",
      email: "student@example.com",
      phone: "123456789",
      password: "secret123",
      role: "STUDENT",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.studentProfile.create).toHaveBeenCalled();
  });

  test("prevents duplicate registration", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "existing" });

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Student",
      email: "student@example.com",
      phone: "123456789",
      password: "secret123",
      role: "STUDENT",
    });

    expect(response.status).toBe(400);
  });

  test("logs in with valid credentials", async () => {
    const passwordHashValue = await hashPassword("secret123");
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      fullName: "Student",
      email: "student@example.com",
      phone: "123456789",
      passwordHash: passwordHashValue,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).post("/api/auth/login").send({
      emailOrPhone: "student@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
  });

  test("retrieves current user info", async () => {
    const token = signToken({ userId: "user-1", role: UserRole.STUDENT });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      fullName: "Student",
      email: "student@example.com",
      phone: "123456789",
      passwordHash: "hash",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      studentProfile: {
        id: "student-1",
        userId: "user-1",
        gradeLevel: "Unknown",
        goals: null,
        preferredSubjects: [],
        notes: null,
      },
      tutorProfile: null,
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.studentProfile).toMatchObject({ id: "student-1" });
  });
});
