'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Quản lý lịch dạy',
    subtitle: 'Xem và xử lý yêu cầu của học viên',
    pending: 'Đang chờ',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn tất',
    nonePending: 'Không có lịch đang chờ',
    noneConfirmed: 'Không có lịch đã xác nhận',
    noneCompleted: 'Không có lịch hoàn tất',
    trial: 'Yêu cầu lớp thử',
    classBooking: 'Đặt lịch học',
    hoursPerWeek: 'giờ mỗi tuần',
    start: 'Bắt đầu',
    studentNote: 'Ghi chú từ học viên',
    confirm: 'Xác nhận',
    confirming: 'Đang xác nhận...',
    reject: 'Từ chối',
    rejecting: 'Đang từ chối...',
    markComplete: 'Đánh dấu hoàn tất',
    completing: 'Đang hoàn tất...',
    completedOn: 'Hoàn tất ngày',
  },
  en: {
    title: 'Manage Bookings',
    subtitle: 'Review and manage your student bookings',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    nonePending: 'No pending bookings',
    noneConfirmed: 'No confirmed bookings',
    noneCompleted: 'No completed bookings',
    trial: 'Trial Class Request',
    classBooking: 'Class Booking',
    hoursPerWeek: 'hours per week',
    start: 'Start',
    studentNote: 'Student Note',
    confirm: 'Confirm',
    confirming: 'Confirming...',
    reject: 'Reject',
    rejecting: 'Rejecting...',
    markComplete: 'Mark as Completed',
    completing: 'Completing...',
    completedOn: 'Completed on',
  },
};

const themeStyles: Record<ThemeMode, Record<string, any>> = {
  dark: {
    text: 'text-white',
    muted: 'text-slate-300',
    subtle: 'text-slate-400',
    sectionCard: 'bg-slate-800/60 border border-slate-700/50',
    badge: {
      pending: 'bg-yellow-500/30 text-yellow-100 border border-yellow-400/60',
      confirmed: 'bg-green-500/30 text-green-100 border border-green-400/60',
      completed: 'bg-slate-500/30 text-slate-100 border border-slate-400/60',
    },
    actionBtn: {
      confirm: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30',
      reject: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30',
      complete: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30',
    },
    note: 'bg-slate-800/70 border border-slate-600/50 text-slate-200',
    card: 'backdrop-blur-xl rounded-xl shadow-lg',
    title: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-700',
    subtle: 'text-slate-500',
    sectionCard: 'bg-white border border-slate-200 shadow-sm',
    badge: {
      pending: 'bg-amber-100 text-amber-700 border border-amber-200',
      confirmed: 'bg-green-100 text-green-700 border border-green-200',
      completed: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    actionBtn: {
      confirm: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm',
      reject: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-sm',
      complete: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm',
    },
    note: 'bg-slate-50 border border-slate-200 text-slate-700',
    card: 'rounded-xl shadow-sm',
    title: 'text-gradient',
  },
};

export default function TutorBookingsPage() {
  const { bookings, isLoading, mutate } = useBookings();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/confirm`, {});
      mutate();
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/reject`, {
        reason: 'Rejected by tutor',
      });
      mutate();
    } catch (error) {
      console.error('Failed to reject booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/complete`, {});
      mutate();
    } catch (error) {
      console.error('Failed to complete booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const groupedBookings = {
    PENDING: bookings.filter((b) => b.status === 'PENDING'),
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED'),
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED'),
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED'),
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <div className="animate-fade-in space-y-2">
          <h1 className={`text-4xl font-bold ${styles.title}`}>
            {t.title}
          </h1>
          <p className={styles.subtle}>{t.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Bookings */}
            <div className={`animate-fade-in ${styles.card} ${styles.sectionCard}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-yellow-500/15">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className={`text-2xl font-bold leading-tight ${styles.text}`}>
                  {t.pending} ({groupedBookings.PENDING.length})
                </h2>
              </div>
              {groupedBookings.PENDING.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.PENDING.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className={`animate-fade-in border rounded-xl p-6 transition duration-300 ${theme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/40 hover:border-yellow-500/60' : 'bg-amber-50 border-amber-200 hover:border-amber-300'}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${styles.text}`}>
                            <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
                            {booking.isTrial ? t.trial : t.classBooking}
                          </h3>
                          <p className={`text-sm mb-1 ${styles.muted}`}>{booking.requestedHoursPerWeek} {t.hoursPerWeek}</p>
                          <p className={`text-sm ${styles.subtle}`}>
                            {t.start}: {new Date(booking.startDateExpected).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge.pending}`}>
                          PENDING
                        </span>
                      </div>
                      {booking.noteFromStudent && (
                        <div className={`text-sm mb-4 p-3 rounded-lg flex items-start gap-2 ${styles.note}`}>
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
                          <span>{t.studentNote}: {booking.noteFromStudent}</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className={`flex-1 px-6 py-2 rounded-lg font-medium transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${styles.actionBtn.confirm}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processingId === booking.id ? t.confirming : t.confirm}
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className={`flex-1 px-6 py-2 rounded-lg font-medium transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${styles.actionBtn.reject}`}
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === booking.id ? t.rejecting : t.reject}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${styles.muted} p-4 rounded-lg border ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>{t.nonePending}</p>
              )}
            </div>

            {/* Confirmed Bookings */}
            <div className={`animate-fade-in ${styles.card} ${styles.sectionCard}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-500/15">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h2 className={`text-2xl font-bold leading-tight ${styles.text}`}>
                  {t.confirmed} ({groupedBookings.CONFIRMED.length})
                </h2>
              </div>
              {groupedBookings.CONFIRMED.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.CONFIRMED.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className={`animate-fade-in border rounded-xl p-6 transition duration-300 ${theme === 'dark' ? 'bg-green-500/10 border-green-500/40 hover:border-green-500/60' : 'bg-green-50 border-green-200 hover:border-green-300'}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${styles.text}`}>
                            <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full" />
                            {t.classBooking}
                          </h3>
                          <p className={`text-sm mb-1 ${styles.muted}`}>{booking.requestedHoursPerWeek} {t.hoursPerWeek}</p>
                          <p className={`text-sm ${styles.subtle}`}>
                            {t.start}: {new Date(booking.startDateExpected).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge.confirmed}`}>
                          CONFIRMED
                        </span>
                      </div>
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={processingId === booking.id}
                        className={`w-full px-6 py-2 rounded-lg font-medium transition duration-300 disabled:opacity-50 ${styles.actionBtn.complete}`}
                      >
                        {processingId === booking.id ? t.completing : t.markComplete}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${styles.muted} p-4 rounded-lg border ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>{t.noneConfirmed}</p>
              )}
            </div>

            {/* Completed Bookings */}
            <div className={`animate-fade-in ${styles.card} ${styles.sectionCard}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-400/15">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                </div>
                <h2 className={`text-2xl font-bold leading-tight ${styles.text}`}>
                  {t.completed} ({groupedBookings.COMPLETED.length})
                </h2>
              </div>
              {groupedBookings.COMPLETED.length > 0 ? (
                <div className="space-y-3">
                  {groupedBookings.COMPLETED.slice(0, 5).map((booking, idx) => (
                    <div
                      key={booking.id}
                      className={`animate-fade-in border rounded-xl p-4 transition duration-300 ${theme === 'dark' ? 'bg-slate-800/80 border-slate-600/50 hover:border-slate-500/50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <p className={`font-medium ${styles.text}`}>Booking {booking.id.slice(0, 8)}</p>
                      <p className={`text-sm ${styles.subtle}`}>{t.completedOn} {new Date(booking.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${styles.muted} p-4 rounded-lg border ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>{t.noneCompleted}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
