'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { usePendingTutors } from '@/hooks/usePendingTutors';
import { CheckCircle, XCircle, Users, BookOpen, BookMarked } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

type Translations = {
  title: string;
  subtitle: string;
  tabs: { pending: string; bookings: string; classes: string };
  education: string;
  location: string;
  experience: string;
  years: string;
  applied: string;
  processing: string;
  approve: string;
  reject: string;
  noPending: string;
  bookingsTable: { id: string; student: string; tutor: string; status: string; hours: string; start: string };
  noBookings: string;
  classes: { tutor: string; price: string; location: string };
  noClasses: string;
};

const translations: Record<Language, Translations> = {
  vi: {
    title: 'Bảng điều khiển quản trị',
    subtitle: 'Quản lý hoạt động và duyệt gia sư trên nền tảng',
    tabs: {
      pending: 'Gia sư chờ duyệt',
      bookings: 'Lịch đặt',
      classes: 'Lớp học',
    },
    education: 'Học vấn',
    location: 'Khu vực',
    experience: 'Kinh nghiệm',
    years: 'năm',
    applied: 'Ngày gửi',
    processing: 'Đang xử lý...',
    approve: 'Duyệt',
    reject: 'Từ chối',
    noPending: 'Không có yêu cầu duyệt gia sư',
    bookingsTable: {
      id: 'Mã',
      student: 'Học viên',
      tutor: 'Gia sư',
      status: 'Trạng thái',
      hours: 'Giờ/tuần',
      start: 'Ngày bắt đầu',
    },
    noBookings: 'Chưa có lịch đặt',
    classes: {
      tutor: 'Gia sư',
      price: 'VNĐ/giờ',
      location: 'Hình thức',
    },
    noClasses: 'Chưa có lớp học',
    themeLabel: 'Giao diện',
    languageLabel: 'Ngôn ngữ',
    dark: 'Tối',
    light: 'Sáng',
    viLabel: 'Tiếng Việt',
    enLabel: 'English',
  },
  en: {
    title: 'Admin Dashboard',
    subtitle: 'Manage platform activity and tutor applications',
    tabs: {
      pending: 'Pending Tutors',
      bookings: 'Bookings',
      classes: 'Classes',
    },
    education: 'Education',
    location: 'Location',
    experience: 'Experience',
    years: 'years',
    applied: 'Applied',
    processing: 'Processing...',
    approve: 'Approve',
    reject: 'Reject',
    noPending: 'No pending tutor approvals',
    bookingsTable: {
      id: 'ID',
      student: 'Student',
      tutor: 'Tutor',
      status: 'Status',
      hours: 'Hours/Week',
      start: 'Start Date',
    },
    noBookings: 'No bookings found',
    classes: {
      tutor: 'Tutor',
      price: 'VND/hour',
      location: 'Location',
    },
    noClasses: 'No classes found',
    themeLabel: 'Theme',
    languageLabel: 'Language',
    dark: 'Dark',
    light: 'Light',
    viLabel: 'Vietnamese',
    enLabel: 'English',
  },
};

const statusTranslations: Record<Language, Record<string, string>> = {
  vi: {
    CONFIRMED: 'Đã xác nhận',
    PENDING: 'Đang chờ',
    COMPLETED: 'Hoàn tất',
    PUBLISHED: 'Đã đăng',
    DRAFT: 'Bản nháp',
  },
  en: {
    CONFIRMED: 'Confirmed',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    PUBLISHED: 'Published',
    DRAFT: 'Draft',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
    textMuted: 'text-white/60',
    card: 'bg-white/10 backdrop-blur-md border border-white/20',
    cardHover: 'hover:bg-white/15',
    tabContainer: 'bg-white/10 backdrop-blur-md border border-white/20',
    inactiveTabText: 'text-white/60 hover:text-white/90',
    tableHeader: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/20',
    tableDivider: 'divide-white/10',
    badgeMuted: 'bg-white/10 text-white/70 border border-white/20',
  },
  light: {
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    card: 'bg-white shadow-sm border border-slate-200',
    cardHover: 'hover:bg-slate-50',
    tabContainer: 'bg-white shadow-sm border border-slate-200',
    inactiveTabText: 'text-slate-500 hover:text-slate-700',
    tableHeader: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-200',
    tableDivider: 'divide-slate-200',
    badgeMuted: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

export default function AdminDashboard() {
  const { theme, language } = useUISettings();
  const { tutors: pendingTutors, isLoading: tutorsLoading, mutate: mutateTutors } = usePendingTutors();
  const [tab, setTab] = useState('pending-tutors');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useSWR(
    tab === 'bookings' ? '/api/admin/bookings' : null,
    apiClient.get
  );

  const { data: classes, isLoading: classesLoading } = useSWR(
    tab === 'classes' ? '/api/admin/classes' : null,
    apiClient.get
  );

  const t = translations[language];
  const styles = themeStyles[theme];
  const statusLabel = statusTranslations[language];
  const badgeStyles = {
    confirmed:
      theme === 'dark'
        ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-100 border border-emerald-300/60'
        : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-700 border border-green-400/60',
    pending:
      theme === 'dark'
        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-amber-100 border border-amber-200/70'
        : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-amber-700 border border-amber-400/60',
    completed:
      theme === 'dark'
        ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-100 border border-blue-200/70'
        : 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-700 border border-blue-400/60',
    draft:
      theme === 'dark'
        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-amber-100 border border-amber-200/70'
        : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-amber-700 border border-amber-400/60',
    muted: styles.badgeMuted,
  };

  const handleVerifyTutor = async (tutorId: string, approved: boolean) => {
    try {
      setProcessingId(tutorId);
      await apiClient.patch(`/api/admin/tutors/${tutorId}/verify`, {
        approved,
        note: approved ? 'Approved by admin' : 'Rejected by admin',
      });
      mutateTutors();
    } catch (error) {
      console.error('Failed to verify tutor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBanTutor = async (tutorId: string, banned: boolean) => {
    try {
      setProcessingId(tutorId);
      await apiClient.patch(`/api/admin/tutors/${tutorId}/ban`, {
        banned,
      });
      mutateTutors();
    } catch (error) {
      console.error('Failed to ban tutor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="min-h-screen p-8 transition-colors duration-300 space-y-8">
        <div className="mb-10 animate-fade-in flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className={`text-base ${styles.textMuted}`}>{t.subtitle}</p>
          </div>
        </div>

        <div className={`flex gap-4 mb-8 rounded-xl p-1 ${styles.tabContainer}`}>
          {[
            { id: 'pending-tutors', label: t.tabs.pending, icon: Users, count: pendingTutors.length },
            { id: 'bookings', label: t.tabs.bookings, icon: BookOpen, count: bookings?.length || 0 },
            { id: 'classes', label: t.tabs.classes, icon: BookMarked, count: classes?.length || 0 },
          ].map((tabItem) => {
            const IconComponent = tabItem.icon;
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg flex-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                    : `${styles.inactiveTabText}`
                }`}
              >
                <IconComponent size={18} />
                <span>{tabItem.label}</span>
                <span className={`ml-auto text-sm opacity-75 ${styles.textMuted}`}>({tabItem.count})</span>
              </button>
            );
          })}
        </div>

        {/* Pending Tutors Tab */}
        {tab === 'pending-tutors' && (
          <div>
            {tutorsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"
                    style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}
                  ></div>
                </div>
              </div>
            ) : pendingTutors.length > 0 ? (
              <div className="space-y-4">
                {pendingTutors.map((tutor, idx) => (
                  <div
                    key={tutor.id}
                    className={`animate-fade-in rounded-xl p-6 transition-all duration-300 ${styles.card} ${styles.cardHover}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className={`text-lg font-bold ${styles.textPrimary}`}>{tutor.user?.fullName ?? tutor.userId}</h3>
                          <p className={`text-sm ${styles.textMuted}`}>
                            ID: {tutor.userId.slice(0, 8)} • Email: {tutor.user?.email ?? '—'} • Phone: {tutor.user?.phone ?? '—'}
                          </p>
                        </div>
                        {tutor.bio && <p className={`mb-1 line-clamp-2 ${styles.textSecondary}`}>{tutor.bio}</p>}
                        <div className={`flex flex-wrap gap-2 text-xs ${styles.textMuted}`}>
                          {tutor.education && (
                            <span className="px-2 py-1 rounded-full border border-dashed border-current">
                              {t.education}: {tutor.education.substring(0, 80)}{tutor.education.length > 80 ? '…' : ''}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-full border border-current">
                            {t.experience}: {tutor.yearsOfExperience} {t.years}
                          </span>
                          <span className="px-2 py-1 rounded-full border border-current">
                            Trust: {tutor.trustScore.toFixed(1)}
                          </span>
                          <span className="px-2 py-1 rounded-full border border-current">
                            Verified ID: {tutor.verified ? 'Yes' : 'No'}
                          </span>
                          <span className="px-2 py-1 rounded-full border border-current">
                            City/District: {[tutor.city, tutor.district].filter(Boolean).join(', ') || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm mb-2 ${styles.textMuted}`}>
                          {t.applied}: {new Date(tutor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, true)}
                        disabled={processingId === tutor.id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                      >
                        <CheckCircle size={16} />
                        {processingId === tutor.id ? t.processing : t.approve}
                      </button>
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, false)}
                        disabled={processingId === tutor.id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                      >
                        <XCircle size={16} />
                        {processingId === tutor.id ? t.processing : t.reject}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl p-12 text-center ${styles.card}`}>
                <p className={`text-lg ${styles.textMuted}`}>{t.noPending}</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"
                    style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}
                  ></div>
                </div>
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className={`overflow-x-auto rounded-xl ${styles.card}`}>
                <table className="w-full">
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.id}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.student}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.tutor}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.status}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.hours}</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.textPrimary}`}>{t.bookingsTable.start}</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableDivider}>
                    {bookings.map((booking: any, idx: number) => (
                      <tr
                        key={booking.id}
                        className={`transition-colors animate-fade-in ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td className={`px-6 py-4 text-sm ${styles.textSecondary}`}>{booking.id.slice(0, 8)}</td>
                        <td className={`px-6 py-4 text-sm ${styles.textSecondary}`}>{booking.student?.user?.fullName || booking.studentId.slice(0, 8)}</td>
                        <td className={`px-6 py-4 text-sm ${styles.textSecondary}`}>{booking.class?.title || booking.tutorId.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'CONFIRMED'
                                ? badgeStyles.confirmed
                                : booking.status === 'PENDING'
                                  ? badgeStyles.pending
                                  : booking.status === 'COMPLETED'
                                    ? badgeStyles.completed
                                    : badgeStyles.muted
                            }`}
                          >
                            {statusLabel[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${styles.textSecondary}`}>{booking.requestedHoursPerWeek}</td>
                        <td className={`px-6 py-4 text-sm ${styles.textSecondary}`}>
                          {new Date(booking.startDateExpected).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`rounded-xl p-12 text-center ${styles.card}`}>
                <p className={`text-lg ${styles.textMuted}`}>{t.noBookings}</p>
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {tab === 'classes' && (
          <div>
            {classesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"
                    style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}
                  ></div>
                </div>
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls: any, idx: number) => (
                  <div
                    key={cls.id}
                    className={`animate-fade-in rounded-xl p-6 transition-all duration-300 ${styles.card} ${styles.cardHover}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-2 ${styles.textPrimary}`}>{cls.title}</h3>
                        <p className={`text-sm mb-2 line-clamp-1 ${styles.textSecondary}`}>{cls.description}</p>
                        <div className={`flex gap-4 text-sm ${styles.textMuted}`}>
                          <span>{t.classes.tutor}: {cls.tutorId.slice(0, 8)}</span>
                          <span>{formatVND(cls.pricePerHour)} ({t.classes.price})</span>
                          <span>{t.classes.location}: {cls.locationType}</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                          cls.status === 'PUBLISHED'
                            ? badgeStyles.confirmed
                            : cls.status === 'DRAFT'
                              ? badgeStyles.draft
                              : badgeStyles.muted
                        }`}
                      >
                        {statusLabel[cls.status] || cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl p-12 text-center ${styles.card}`}>
                <p className={`text-lg ${styles.textMuted}`}>{t.noClasses}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

