import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { UserRole } from "@prisma/client";

const adminToken = signToken({ userId: "admin", role: UserRole.ADMIN });

describe("Subject routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("lists subjects", async () => {
    mockPrisma.subject.findMany.mockResolvedValue([{ id: "s1", name: "Toán", level: "THCS" }]);

    const res = await request(app).get("/api/subjects");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Toán" })]));
  });

  test("creates subject as admin", async () => {
    mockPrisma.subject.create.mockResolvedValue({ id: "s1", name: "Lý", level: "THPT" });

    const res = await request(app)
      .post("/api/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Lý", level: "THPT", description: "Vật lý cơ bản" });

    expect(res.status).toBe(201);
    expect(mockPrisma.subject.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Lý", level: "THPT" }),
      })
    );
  });
});
