const VerificationStatus = {
  UNVERIFIED: "UNVERIFIED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
import { mockPrisma } from "../utils/mockPrisma";
import {
  submitTutorVerification,
  approveTutorVerification,
  rejectTutorVerification,
} from "../../src/services/tutorVerification";

describe("Tutor verification service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("submit sets status to PENDING and clears review", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.UNVERIFIED,
    } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.PENDING,
      verificationReviewedAt: null,
      verified: false,
    } as any);

    await submitTutorVerification(mockPrisma as any, "t1", {
      nationalIdNumber: "123456789",
      nationalIdFrontImageUrl: "http://front",
      nationalIdBackImageUrl: "http://back",
    });

    expect(mockPrisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({ verificationStatus: VerificationStatus.PENDING }),
      })
    );
  });

  test("submit throws when status is PENDING", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.PENDING,
    } as any);

    await expect(
      submitTutorVerification(mockPrisma as any, "t1", {
        nationalIdNumber: "123456789",
        nationalIdFrontImageUrl: "http://front",
        nationalIdBackImageUrl: "http://back",
      })
    ).rejects.toThrow("not allowed");
  });

  test("verified tutor resubmission is allowed and reverts to pending", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.VERIFIED,
    } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.PENDING,
    } as any);

    await submitTutorVerification(mockPrisma as any, "t1", {
      nationalIdNumber: "123456789",
      nationalIdFrontImageUrl: "http://front",
      nationalIdBackImageUrl: "http://back",
    });

    expect(mockPrisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationStatus: VerificationStatus.PENDING }),
      })
    );
  });

  test("approve moves to VERIFIED and sets flag", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.PENDING,
    } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.VERIFIED,
      verified: true,
    } as any);

    await approveTutorVerification(mockPrisma as any, "t1", "ok");
    expect(mockPrisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationStatus: VerificationStatus.VERIFIED, verified: true }),
      })
    );
  });

  test("reject moves to REJECTED and clears verified flag", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.PENDING,
    } as any);
    mockPrisma.tutorProfile.update.mockResolvedValue({
      id: "t1",
      verificationStatus: VerificationStatus.REJECTED,
      verified: false,
    } as any);

    await rejectTutorVerification(mockPrisma as any, "t1", "bad");
    expect(mockPrisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationStatus: VerificationStatus.REJECTED, verified: false }),
      })
    );
  });
});
