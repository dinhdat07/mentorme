'use client';

import { apiClient } from '@/lib/api-client';
import { TutorProfile } from '@/lib/types';
import useSWR from 'swr';

export interface MatchingTimeSlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface MatchingRequest {
  subjectId: string;
  gradeLevel: string;
  budgetPerHour: number;
  desiredSlots: MatchingTimeSlot[];
  city?: string;
  district?: string;
  description?: string;
  limit?: number;
}

export interface MatchedTutor {
  tutor: TutorProfile;
  score: number;
  reasons: string[];
}

export const useMatching = (payload?: MatchingRequest) => {
  const shouldFetch = Boolean(payload && payload.subjectId && payload.desiredSlots?.length);

  const { data, error, isLoading } = useSWR<MatchedTutor[]>(
    shouldFetch ? ['matching', payload] : null,
    () => apiClient.post<MatchedTutor[]>('/api/matching/tutors', payload),
    { revalidateOnFocus: false }
  );

  return {
    matches: data ?? [],
    isLoading,
    error,
  };
};
