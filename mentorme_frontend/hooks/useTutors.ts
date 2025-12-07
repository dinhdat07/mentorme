'use client';

import { apiClient } from '@/lib/api-client';
import { TutorProfile } from '@/lib/types';
import useSWR from 'swr';

export interface TutorFilters {
  subjectId?: string;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  trustScoreMin?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const useTutors = (filters?: TutorFilters) => {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (typeof value === 'string' && value.trim() === '') return;
      queryParams.append(key, String(value));
    });
  }

  const queryString = queryParams.toString() ? `?${queryParams}` : '';
  const { data, error, isLoading } = useSWR<any>(
    `/api/tutors${queryString}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    tutors: data?.data || data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};
