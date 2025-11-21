"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export function useClassBookings(userId?: string) {
  // Lấy danh sách booking của học sinh hiện tại
  const { data: bookings } = useSWR(
    userId ? `/api/bookings?studentId=${userId}` : null,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  // Trả về object { classId: booking } để dễ lookup
  const bookingsMap =
    bookings?.reduce<Record<string, any>>((acc, b: any) => {
      acc[b.classId] = b;
      return acc;
    }, {}) || {};

  return bookingsMap;
}
