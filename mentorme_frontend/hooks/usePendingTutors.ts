'use client';

import { apiClient } from '@/lib/api-client';
import { TutorProfile, User } from '@/lib/types';
import useSWR from 'swr';

export const usePendingTutors = () => {
  type PendingTutor = TutorProfile & { user: User };

  const { data, error, isLoading, mutate } = useSWR<PendingTutor[]>(
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
