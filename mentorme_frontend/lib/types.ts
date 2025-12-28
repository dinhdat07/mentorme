/**
 * TypeScript types matching OpenAPI schema
 */

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
export type ClassStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ClassLifecycleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'TRIAL' | 'CANCELLED' | 'COMPLETED';
export type LocationType = 'ONLINE' | 'AT_STUDENT' | 'AT_TUTOR';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type LedgerType = 'DEPOSIT' | 'RELEASE_TO_TUTOR' | 'PLATFORM_FEE' | 'REFUND';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  gradeLevel: string;
  goals?: string;
  goalsEmbedding?: number[];
  goalsEmbeddingModel?: string;
  preferredSubjects: string[];
  notes?: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  bio?: string;
  education?: string;
  certificates: string[];
  certificatesDetail?: any;
  proofDocuments?: any;
  nationalIdNumber?: string | null;
  nationalIdFrontImageUrl?: string | null;
  nationalIdBackImageUrl?: string | null;
  verificationStatus?: VerificationStatus;
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  verificationNotes?: string | null;
  yearsOfExperience: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  teachingModes: string[];
  city?: string;
  district?: string;
  verified: boolean;
  trustScore: number;
  totalBookings: number;
  averageRating: number;
  totalCancelledBookings: number;
  totalCompletedBookings: number;
  policyViolationsCount: number;
  avgResponseTimeSeconds: number;
  lastTrustScoreUpdatedAt: string;
  totalReviews: number;
  profileEmbedding?: number[];
  profileEmbeddingModel?: string;
  createdAt: string;
  updatedAt: string;
  availabilities?: TutorAvailability[];
  classes?: Class[];
}

export interface TutorAvailability {
  id: string;
  tutorId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
  locationType: LocationType;
  createdAt: string;
  updatedAt: string;
}

export interface TutorUnavailability {
  id: string;
  tutorId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  classId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: SessionStatus;
  tutorStartConfirmedAt?: string | null;
  studentStartConfirmedAt?: string | null;
  tutorCompleteConfirmedAt?: string | null;
  studentCompleteConfirmedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  disputeFlaggedAt?: string | null;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  timezone: string;
  recurrenceRule?: any;
  explicitSessions?: any;
  totalSessions: number;
}

export interface Subject {
  id: string;
  name: string;
  level: string;
  description?: string;
}

export interface Class {
  id: string;
  tutorId: string;
  subjectId: string;
  title: string;
  description: string;
  targetGrade?: string;
  pricePerHour: number;
  locationType: LocationType;
  city?: string;
  district?: string;
  status: ClassStatus;
  lifecycleStatus?: ClassLifecycleStatus;
  totalSessions?: number;
  sessionsCompleted?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  classId: string;
  studentId: string;
  tutorId: string;
  status: BookingStatus;
  isTrial: boolean;
  requestedHoursPerWeek: number;
  startDateExpected: string;
  noteFromStudent?: string;
  cancelReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  student?: (StudentProfile & { user?: User });
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  classId: string;
  payerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowAccount {
  id?: string;
  classId: string;
  totalDeposited: number;
  availableBalance: number;
  releasedAmount: number;
  refundedAmount: number;
}

export interface LedgerEntry {
  id: string;
  classId: string;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  type: LedgerType;
  amount: number;
  createdAt: string;
}

export interface PaymentSummary {
  escrow: EscrowAccount;
  ledger: LedgerEntry[];
  unpaidCompleted: number;
  nextReleaseAmount?: number | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  studentProfile?: StudentProfile;
  tutorProfile?: TutorProfile;
}
