import { jest } from "@jest/globals";

type ModelMock = Record<string, jest.Mock>;

type PrismaMock = {
  user: ModelMock;
  studentProfile: ModelMock;
  tutorProfile: ModelMock;
  class: ModelMock;
  booking: ModelMock;
  review: ModelMock;
  subject: ModelMock;
  $transaction: jest.Mock;
};

const createModelMock = () => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  updateMany: jest.fn(),
});

export const mockPrisma: PrismaMock = {
  user: createModelMock(),
  studentProfile: createModelMock(),
  tutorProfile: createModelMock(),
  class: createModelMock(),
  booking: createModelMock(),
  review: createModelMock(),
  subject: createModelMock(),
  $transaction: jest.fn(),
};

export const resetMockPrisma = () => {
  const resetModel = (model: ModelMock) => {
    Object.values(model).forEach((fn) => fn.mockReset());
  };
  resetModel(mockPrisma.user);
  resetModel(mockPrisma.studentProfile);
  resetModel(mockPrisma.tutorProfile);
  resetModel(mockPrisma.class);
  resetModel(mockPrisma.booking);
  resetModel(mockPrisma.review);
  resetModel(mockPrisma.subject);
  mockPrisma.$transaction.mockReset();
};
