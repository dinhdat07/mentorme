import { jest } from "@jest/globals";
import { mockPrisma, resetMockPrisma } from "./utils/mockPrisma";

jest.mock("../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  resetMockPrisma();
  mockPrisma.$transaction.mockImplementation(async (arg: any) => {
    if (typeof arg === "function") {
      return arg(mockPrisma as any);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg;
  });
});
