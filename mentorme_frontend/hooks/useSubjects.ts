'use client';

import { apiClient } from '@/lib/api-client';
import { Subject } from '@/lib/types';
import useSWR from 'swr';

export const useSubjects = () => {
  const { data, error, isLoading } = useSWR<Subject[]>(
    '/api/subjects',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    subjects: data || [],
    isLoading,
    error,
  };
};
