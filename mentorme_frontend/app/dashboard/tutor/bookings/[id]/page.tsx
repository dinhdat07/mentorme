'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { Booking } from '@/lib/types';
import { useUISettings } from '@/components/ui-settings-context';
import { Calendar, Clock, Mail, Phone, User, CheckCircle, XCircle } from 'lucide-react';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Chi tiết lịch đặt',
    class: 'Lớp học',
    student: 'Học viên',
    status: 'Trạng thái',
    hours: 'Giờ/tuần',
    start: 'Ngày bắt đầu',
    note: 'Ghi chú từ học viên',
    confirm: 'Xác nhận',
    reject: 'Từ chối',
    complete: 'Hoàn tất',
    confirmProcessing: 'Đang xác nhận...',
    rejectProcessing: 'Đang từ chối...',
    completeProcessing: 'Đang hoàn tất...',
    back: 'Quay lại',
    error: 'Có lỗi xảy ra',
  },
  en: {
    title: 'Booking Detail',
    class: 'Class',
    student: 'Student',
    status: 'Status',
    hours: 'Hours/Week',
    start: 'Start Date',
    note: 'Student Note',
    confirm: 'Confirm',
    reject: 'Reject',
    complete: 'Mark Complete',
    confirmProcessing: 'Confirming...',
    rejectProcessing: 'Rejecting...',
    completeProcessing: 'Completing...',
    back: 'Back',
    error: 'Something went wrong',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    card: 'bg-slate-900/70 border border-slate-800 text-white',
    muted: 'text-white/70',
    badge: 'bg-purple-500/10 text-purple-200 border border-purple-400/40',
    buttonPrimary:
      'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white',
    buttonDanger:
      'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white',
    buttonInfo:
      'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white',
  },
  light: {
    card: 'bg-white border border-slate-200 text-slate-900',
    muted: 'text-slate-600',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    buttonPrimary:
      'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
    buttonDanger:
      'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white',
    buttonInfo:
      'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
  },
};

export default function TutorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  const { data: booking, isLoading, mutate } = useSWR<Booking>(`/api/bookings/${bookingId}`, apiClient.get, {
    revalidateOnFocus: false,
  });

  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<'confirm' | 'reject' | 'complete' | null>(null);

  const handleAction = async (action: 'confirm' | 'reject' | 'complete') => {
    try {
      setProcessing(action);
      setError('');
      if (action === 'confirm') {
        await apiClient.patch(`/api/bookings/${bookingId}/confirm`, {});
      } else if (action === 'reject') {
        await apiClient.patch(`/api/bookings/${bookingId}/reject`, { reason: 'Rejected by tutor' });
      } else {
        await apiClient.patch(`/api/bookings/${bookingId}/complete`, {});
      }
      mutate();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err?.message || t.error);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-sm font-semibold';
    switch (status) {
      case 'CONFIRMED':
        return `${base} ${styles.badge}`;
      case 'PENDING':
        return `${base} ${styles.badge}`;
      case 'COMPLETED':
        return `${base} ${styles.badge}`;
      case 'CANCELLED':
        return `${base} bg-slate-200 text-slate-700 border border-slate-300`;
      default:
        return `${base} ${styles.badge}`;
    }
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 space-y-6">
        <button onClick={() => router.back()} className="text-purple-500 hover:underline">
          {t.back}
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : booking ? (
          <div className={`rounded-xl p-6 ${styles.card} space-y-4`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t.status}</p>
                <div className="inline-flex flex-wrap items-center gap-2">
                  <span className={statusBadge(booking.status)}>{booking.status}</span>
                  <span className={`${styles.muted} text-xs`}>
                    {new Date(booking.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right min-w-[200px]">
                <p className="text-2xl font-bold leading-tight">
                  {booking.class?.title || `Booking ${booking.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">{t.class}</h3>
                <p className={styles.muted}>{booking.class?.description}</p>
                <p className="text-sm text-purple-500 font-semibold">
                  {booking.class?.pricePerHour?.toLocaleString('vi-VN')} ₫/giờ
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t.student}
                </h3>
                <p className={styles.muted}>{booking.student?.user?.fullName || '-'}</p>
                {booking.student?.gradeLevel && (
                  <p className={`text-xs ${styles.muted}`}>
                    {language === 'vi' ? 'Khối' : 'Grade'}: {booking.student.gradeLevel}
                  </p>
                )}
                {booking.student?.notes && (
                  <p className={`text-xs ${styles.muted}`}>
                    {language === 'vi' ? 'Ghi chú hồ sơ' : 'Profile notes'}: {booking.student.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className={`flex items-center gap-2 ${styles.muted}`}>
                <Clock className="w-4 h-4" /> {booking.requestedHoursPerWeek} {t.hours}
              </div>
              <div className={`flex items-center gap-2 ${styles.muted}`}>
                <Calendar className="w-4 h-4" /> {t.start}: {new Date(booking.startDateExpected).toLocaleDateString()}
              </div>
              <div className={`flex items-center gap-2 ${styles.muted}`}>
                <Mail className="w-4 h-4" /> {booking.isTrial ? 'Trial' : 'Regular'}
              </div>
            </div>

            {booking.noteFromStudent && (
              <div className={`${styles.muted} text-sm p-3 rounded-lg border border-dashed border-purple-400/50`}>
                {t.note}: {booking.noteFromStudent}
              </div>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-3">
              {booking.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleAction('confirm')}
                    disabled={processing !== null}
                    className={`px-4 py-2 rounded-lg font-semibold ${styles.buttonPrimary} disabled:opacity-50`}
                  >
                    {processing === 'confirm' ? t.confirmProcessing : t.confirm}
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={processing !== null}
                    className={`px-4 py-2 rounded-lg font-semibold ${styles.buttonDanger} disabled:opacity-50`}
                  >
                    {processing === 'reject' ? t.rejectProcessing : t.reject}
                  </button>
                </>
              )}
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleAction('complete')}
                  disabled={processing !== null}
                  className={`px-4 py-2 rounded-lg font-semibold ${styles.buttonInfo} disabled:opacity-50`}
                >
                  {processing === 'complete' ? t.completeProcessing : t.complete}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-red-500">{t.error}</div>
        )}
      </div>
    </DashboardLayout>
  );
}
