/**
 * TypeScript types matching OpenAPI schema
 */

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
export type ClassStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'TRIAL' | 'CANCELLED' | 'COMPLETED';
export type LocationType = 'ONLINE' | 'AT_STUDENT' | 'AT_TUTOR';

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
  locationType: LocationType;
  createdAt: string;
  updatedAt: string;
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

export interface AuthResponse {
  user: User;
  accessToken: string;
  studentProfile?: StudentProfile;
  tutorProfile?: TutorProfile;
}
