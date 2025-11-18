'use client';

import { apiClient } from '@/lib/api-client';
import { TutorProfile } from '@/lib/types';
import useSWR from 'swr';

export interface MatchingFilters {
  studentId?: string;
  subjectId?: string;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
}

export const useMatching = (filters?: MatchingFilters) => {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString() ? `?${queryParams}` : '';
  const { data, error, isLoading } = useSWR<any>(
    `/api/matching/tutors${queryString}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    matches: data?.data || [],
    isLoading,
    error,
  };
};
