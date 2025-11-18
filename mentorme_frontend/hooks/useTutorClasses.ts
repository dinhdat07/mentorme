'use client';

import { apiClient } from '@/lib/api-client';
import { Class } from '@/lib/types';
import useSWR from 'swr';

export const useTutorClasses = () => {
  const { data, error, isLoading, mutate } = useSWR<Class[]>(
    '/api/tutors/me/classes',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    classes: data || [],
    isLoading,
    error,
    mutate,
  };
};
