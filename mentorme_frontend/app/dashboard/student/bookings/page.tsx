'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Lịch học của tôi',
    subtitle: 'Quản lý và theo dõi buổi học của bạn',
    trial: 'Lớp thử',
    regular: 'Lớp thường',
    startDate: 'Ngày bắt đầu',
    hours: 'giờ mỗi tuần',
    cancelling: 'Đang hủy...',
    cancel: 'Hủy lịch',
    empty: 'Chưa có lịch đặt',
    findTutors: 'Tìm gia sư',
  },
  en: {
    title: 'My Bookings',
    subtitle: 'Manage and track your tutoring sessions',
    trial: 'Trial Class',
    regular: 'Regular Class',
    startDate: 'Start Date',
    hours: 'hours per week',
    cancelling: 'Cancelling...',
    cancel: 'Cancel',
    empty: 'No bookings yet',
    findTutors: 'Find Tutors',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    text: 'text-white',
    muted: 'text-white/70',
    card: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20',
    badge: {
      confirmed: 'bg-green-500/20 text-green-200 border border-green-500/50',
      pending: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50',
      cancelled: 'bg-red-500/20 text-red-200 border border-red-500/50',
      default: 'bg-slate-500/20 text-slate-200 border border-slate-500/50',
    },
    cancelBtn: 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 hover:border-red-500/50',
    emptyBtn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30',
    headerText: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-600',
    card: 'bg-white border border-slate-200 shadow-sm',
    badge: {
      confirmed: 'bg-green-100 text-green-700 border border-green-200',
      pending: 'bg-amber-100 text-amber-700 border border-amber-200',
      cancelled: 'bg-red-100 text-red-700 border border-red-200',
      default: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    cancelBtn: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 hover:border-red-300',
    emptyBtn: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm',
    headerText: 'text-gradient',
  },
};

export default function StudentBookingsPage() {
  const { bookings, isLoading, mutate } = useBookings();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by student',
      });
      mutate();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
        <div className="p-8 transition-colors duration-300 space-y-8">
          <div className="mb-10 animate-fade-in">
            <h1 className={`text-4xl font-bold leading-tight mb-2 ${styles.headerText}`}>{t.title}</h1>
            <p className={`${styles.muted}`}>{t.subtitle}</p>
          </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <div
                key={booking.id}
                className={`group backdrop-blur-xl rounded-xl p-6 hover:border-purple-500/50 transition duration-300 shadow-lg animate-fade-in ${styles.card}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${styles.text}`}>
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      {booking.class?.title || `Booking ${booking.id.slice(0, 8)}`}
                    </h3>
                    <div className="space-y-2">
                      <p className={`text-sm flex items-center gap-2 ${styles.text}`}>
                        <span className="text-lg">{booking.isTrial ? '📚' : '👨‍🎓'}</span>
                        {booking.isTrial ? t.trial : t.regular}
                      </p>
                      <p className={`text-sm flex items-center gap-2 ${styles.muted}`}>
                        <Calendar className="w-4 h-4" />
                        {t.startDate}: {new Date(booking.startDateExpected).toLocaleDateString()}
                      </p>
                      <p className={`text-sm flex items-center gap-2 ${styles.muted}`}>
                        <Clock className="w-4 h-4" />
                        {booking.requestedHoursPerWeek} {t.hours}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 transition duration-300 ${
                      booking.status === 'CONFIRMED' ? styles.badge.confirmed :
                      booking.status === 'PENDING' ? styles.badge.pending :
                      booking.status === 'CANCELLED' ? styles.badge.cancelled :
                      styles.badge.default
                    }`}>
                      {booking.status}
                    </span>
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className={`block w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${styles.cancelBtn}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancellingId === booking.id ? t.cancelling : t.cancel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`backdrop-blur-xl rounded-xl p-12 text-center animate-fade-in ${styles.card}`}>
            <p className={`${styles.muted} text-lg mb-6`}>{t.empty}</p>
            <a
              href="/tutors"
              className={`inline-block px-6 py-3 rounded-lg font-medium transition duration-300 ${styles.emptyBtn}`}
            >
              {t.findTutors}
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
