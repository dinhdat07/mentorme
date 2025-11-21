"use client";

import { apiClient } from "@/lib/api-client";
import { TutorProfile } from "@/lib/types";
import useSWR from "swr";

export interface TutorFilters {
  subjectId?: string;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  trustScoreMin?: number;
  page?: number;
  pageSize?: number;
}

export const useTutors = (filters: TutorFilters) => {
  // tạo key SWR dựa trên filters
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/matching/tutors?${queryString}`
    : `/api/matching/tutors`;
  console.log("Fetching URL:", url);

  const { data, error, isLoading, mutate } = useSWR<any>(url, apiClient.get, {
    revalidateOnFocus: false,
  });
  console.log(data);
  return {
    tutors: data || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate, // nếu muốn trigger fetch thủ công
  };
};
