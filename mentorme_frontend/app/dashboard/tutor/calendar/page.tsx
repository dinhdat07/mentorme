"use client";

import useSWR from "swr";
import { DashboardLayout } from "@/components/dashboard-layout";
import { apiClient, ApiError } from "@/lib/api-client";
import { useUISettings } from "@/components/ui-settings-context";
import { CalendarDays, Clock, User, MapPin, BookOpen } from "lucide-react";
import { SessionStatus } from "@/lib/types";
import { useState } from "react";

// 1. CẬP NHẬT TYPE CHO KHỚP VỚI BACKEND GIA SƯ
type CalendarSession = {
  id: string;
  classTitle: string;
  studentName: string; // <-- API Tutor trả về tên Học sinh
  subjectName: string;

  // Dữ liệu lịch cố định
  dayOfWeek: number; // 0-6
  startTime: string; // "14:00"
  endTime: string; // "16:00"

  status: SessionStatus;
  locationType: string;
};

export default function TutorCalendarPage() {
  const { theme, language } = useUISettings();

  // 2. GỌI API DÀNH CHO GIA SƯ
  const { data, error, isLoading, mutate } = useSWR<CalendarSession[]>(
    "/api/calendar/tutor",
    apiClient.get
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const t = {
    title: language === "vi" ? "Lịch dạy của tôi" : "My Teaching Schedule",
    subtitle:
      language === "vi"
        ? "Lịch dạy cố định hàng tuần"
        : "Weekly recurring schedule",
    empty: language === "vi" ? "Chưa có lớp dạy nào" : "No classes scheduled",
    refresh: language === "vi" ? "Tải lại" : "Refresh",
    startBtn: language === "vi" ? "Bắt đầu lớp" : "Start Class",
    completeBtn: language === "vi" ? "Kết thúc lớp" : "Mark Complete",
    student: language === "vi" ? "Học viên" : "Student",
  };

  const textColor = theme === "dark" ? "text-white" : "text-slate-900";
  const muted = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const card =
    theme === "dark"
      ? "bg-slate-900/70 border border-slate-800"
      : "bg-white border border-slate-200";

  // Helper: Chuyển số sang tên Thứ
  const getDayName = (dayIndex: number) => {
    const days =
      language === "vi"
        ? [
            "Chủ Nhật",
            "Thứ Hai",
            "Thứ Ba",
            "Thứ Tư",
            "Thứ Năm",
            "Thứ Sáu",
            "Thứ Bảy",
          ]
        : [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
    return days[dayIndex] || "Unknown";
  };

  // Helper: Tính ngày giờ thực tế trong tuần này để check nút bấm
  const getSessionDateTimeThisWeek = (dayOfWeek: number, timeStr: string) => {
    const now = new Date();
    const currentDay = now.getDay();
    const distance = dayOfWeek - currentDay;

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + distance);

    const [hours, minutes] = timeStr.split(":").map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    return targetDate;
  };

  // Logic check nút Bắt đầu (Gia sư được vào sớm 30p)
  const canStart = (s: CalendarSession) => {
    const start = getSessionDateTimeThisWeek(
      s.dayOfWeek,
      s.startTime
    ).getTime();
    const now = Date.now();

    const isToday = new Date().getDay() === s.dayOfWeek;
    if (!isToday) return false;

    return (
      now >= start - 30 * 60 * 1000 &&
      now <= start + 60 * 60 * 1000 &&
      s.status !== "COMPLETED"
    );
  };

  // Logic check nút Hoàn thành
  const canComplete = (s: CalendarSession) => {
    const end = getSessionDateTimeThisWeek(s.dayOfWeek, s.endTime).getTime();
    const now = Date.now();

    const isToday = new Date().getDay() === s.dayOfWeek;
    if (!isToday) return false;

    return now >= end && s.status !== "COMPLETED" && s.status !== "CANCELLED";
  };

  const doAction = async (id: string, action: "start" | "complete") => {
    setLoadingId(id);
    setActionError(null);
    try {
      await apiClient.patch(`/api/sessions/${id}/${action}`, {});
      await mutate();
    } catch (e: any) {
      const apiErr = e as ApiError;
      setActionError(apiErr?.message || "Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={["TUTOR"]}>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon màu xanh dương cho Gia sư để phân biệt */}
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <CalendarDays className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textColor}`}>{t.title}</h1>
              <p className={muted}>{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow hover:opacity-90 transition-opacity"
          >
            {t.refresh}
          </button>
        </div>

        <div className={`rounded-xl p-6 border ${card}`}>
          {isLoading && <p className={muted}>Loading schedule...</p>}
          {error && (
            <p className="text-red-500">
              {(error as ApiError).message || "Error loading data"}
            </p>
          )}
          {actionError && (
            <p className="text-red-500 mb-4 bg-red-50 p-2 rounded border border-red-200">
              {actionError}
            </p>
          )}

          {!isLoading && !error && data && data.length === 0 && (
            <div className="text-center py-10">
              <p className={muted}>{t.empty}</p>
            </div>
          )}

          <div className="grid gap-4">
            {data?.map((s) => (
              <div
                key={s.id + s.dayOfWeek + s.startTime}
                className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md ${
                  theme === "dark"
                    ? "bg-slate-800/40 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Thanh màu bên trái (Màu xanh dương cho Tutor) */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    s.status === "TRIAL" ? "bg-amber-400" : "bg-blue-500"
                  }`}
                />

                <div className="flex flex-col md:flex-row md:items-center gap-6 pl-2">
                  {/* Cột 1: Thời gian - Sửa lỗi Invalid Date ở đây */}
                  <div className="flex flex-col items-center justify-center min-w-[140px] text-center md:border-r border-slate-200 dark:border-slate-700 md:pr-6">
                    <span
                      className={`text-sm font-bold uppercase tracking-wider ${
                        theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {getDayName(s.dayOfWeek)}
                    </span>
                    <span className={`text-2xl font-black ${textColor}`}>
                      {s.startTime}
                    </span>
                    <span className={`text-sm ${muted}`}>đến {s.endTime}</span>
                  </div>

                  {/* Cột 2: Thông tin lớp */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-lg font-bold ${textColor}`}>
                        {s.classTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === "TRIAL"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                      {/* Hiển thị tên HỌC VIÊN thay vì Gia sư */}
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>
                          {t.student}:{" "}
                          <span className={textColor}>{s.studentName}</span>
                        </span>
                      </div>

                      {s.subjectName && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">{s.subjectName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{s.locationType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
