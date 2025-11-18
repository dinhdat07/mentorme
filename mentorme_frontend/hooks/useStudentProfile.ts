'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentProfile } from '@/lib/types';
import useSWR from 'swr';

export const useStudentProfile = () => {
  const { data, error, isLoading, mutate } = useSWR<StudentProfile>(
    '/api/students/me',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const updateProfile = useCallback(
    async (updates: Partial<StudentProfile>) => {
      try {
        const updated = await apiClient.patch<StudentProfile>(
          '/api/students/me',
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
