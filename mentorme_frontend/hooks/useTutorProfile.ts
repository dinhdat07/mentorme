'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { TutorProfile } from '@/lib/types';
import useSWR from 'swr';

export const useTutorProfile = () => {
  const { data, error, isLoading, mutate } = useSWR<TutorProfile>(
    '/api/tutors/me',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const updateProfile = useCallback(
    async (updates: Partial<TutorProfile>) => {
      try {
        const updated = await apiClient.patch<TutorProfile>(
          '/api/tutors/me',
          updates
        );
        mutate(updated);
        return updated;
      } catch (error) {
        throw error;
      }
    },
    [mutate]
  );

  return {
    profile: data || null,
    isLoading,
    error,
    updateProfile,
    mutate,
  };
};
