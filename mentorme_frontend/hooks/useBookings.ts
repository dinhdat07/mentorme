'use client';

import { apiClient } from '@/lib/api-client';
import { Booking } from '@/lib/types';
import useSWR from 'swr';

export const useBookings = (status?: string) => {
  const queryString = status ? `?status=${status}` : '';
  const { data, error, isLoading, mutate } = useSWR<Booking[]>(
    `/api/bookings${queryString}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return {
    bookings: data || [],
    isLoading,
    error,
    mutate,
  };
};
