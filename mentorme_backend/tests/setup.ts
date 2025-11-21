import { jest } from "@jest/globals";
import { mockPrisma, resetMockPrisma } from "./utils/mockPrisma";

jest.mock("../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  resetMockPrisma();
});
