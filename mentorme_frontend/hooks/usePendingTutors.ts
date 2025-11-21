'use client';

import { apiClient } from '@/lib/api-client';
import { TutorProfile } from '@/lib/types';
import useSWR from 'swr';

export const usePendingTutors = () => {
  const { data, error, isLoading, mutate } = useSWR<TutorProfile[]>(
    '/api/admin/tutors/pending',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    tutors: data || [],
    isLoading,
    error,
    mutate,
  };
};
