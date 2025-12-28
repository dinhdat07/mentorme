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
  tutorAvailability: ModelMock;
  tutorUnavailability: ModelMock;
  classSchedule: ModelMock;
  session: ModelMock;
  notification: ModelMock;
  reminderLog: ModelMock;
  paymentIntent: ModelMock;
  escrowAccount: ModelMock;
  ledgerEntry: ModelMock;
  $transaction: jest.Mock;
  prisma?: never;
};

const createModelMock = () => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
  upsert: jest.fn(),
  aggregate: jest.fn(),
});

export const mockPrisma: PrismaMock = {
  user: createModelMock(),
  studentProfile: createModelMock(),
  tutorProfile: createModelMock(),
  class: createModelMock(),
  booking: createModelMock(),
  review: createModelMock(),
  subject: createModelMock(),
  tutorAvailability: createModelMock(),
  tutorUnavailability: createModelMock(),
  classSchedule: createModelMock(),
  session: createModelMock(),
  notification: createModelMock(),
  reminderLog: createModelMock(),
  paymentIntent: createModelMock(),
  escrowAccount: createModelMock(),
  ledgerEntry: createModelMock(),
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
  resetModel(mockPrisma.tutorAvailability);
  resetModel(mockPrisma.tutorUnavailability);
  resetModel(mockPrisma.classSchedule);
  resetModel(mockPrisma.session);
  resetModel(mockPrisma.notification);
  resetModel(mockPrisma.reminderLog);
  resetModel(mockPrisma.paymentIntent);
  resetModel(mockPrisma.escrowAccount);
  resetModel(mockPrisma.ledgerEntry);
  mockPrisma.$transaction.mockReset();
};
