'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useAuthContext } from '@/components/auth-provider';
import { BookOpen, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    welcome: 'Chào mừng trở lại',
    subtitle: 'Tiếp tục hành trình học với gia sư phù hợp',
    stats: { pending: 'Đang chờ', active: 'Đang học', total: 'Tổng' },
    bookingRequests: 'Yêu cầu đặt lịch',
    classesBooked: 'Lớp đã đặt',
    allBookings: 'Tất cả lịch',
    discoverTitle: 'Khám phá gia sư',
    discoverDesc: 'Tìm gia sư phù hợp nhất với bạn',
    profileTitle: 'Hồ sơ của bạn',
    profileDesc: 'Cập nhật thông tin học tập',
    recent: 'Lịch đặt gần đây',
    trial: 'Lớp thử',
    regular: 'Lớp thường',
    none: 'Chưa có lịch đặt.',
    findTutor: 'Tìm gia sư',
  },
  en: {
    welcome: 'Welcome back',
    subtitle: 'Continue your learning journey with expert tutors',
    stats: { pending: 'Pending', active: 'Active', total: 'Total' },
    bookingRequests: 'Booking requests',
    classesBooked: 'Classes booked',
    allBookings: 'All bookings',
    discoverTitle: 'Discover Tutors',
    discoverDesc: 'Browse and find your perfect tutor',
    profileTitle: 'Your Profile',
    profileDesc: 'Update your learning preferences',
    recent: 'Recent Bookings',
    trial: 'Trial Class',
    regular: 'Regular Class',
    none: 'No bookings yet.',
    findTutor: 'Find a tutor',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    glass: 'bg-white/10 border border-white/20 text-white',
    muted: 'text-white/70',
    softCard: 'bg-white/10 border border-white/15',
    hover: 'hover:bg-white/20',
    heading: 'text-white',
  },
  light: {
    glass: 'bg-white border border-slate-200 text-slate-900 shadow-sm',
    muted: 'text-slate-600',
    softCard: 'bg-slate-50 border border-slate-200',
    hover: 'hover:bg-white',
    heading: 'text-slate-900',
  },
};

export default function StudentDashboard() {
  const { bookings, isLoading } = useBookings();
  const { user } = useAuthContext();
  const { theme, language } = useUISettings();

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const t = translations[language];
  const styles = themeStyles[theme];
  const isDark = theme === 'dark';

  const badgeStyles = {
    confirmed: isDark ? 'bg-green-500/30 border-green-400/60 text-green-100' : 'bg-green-100 border-green-300 text-green-700',
    pending: isDark ? 'bg-yellow-500/30 border-yellow-400/60 text-yellow-100' : 'bg-yellow-100 border-yellow-300 text-yellow-700',
    default: isDark ? 'bg-slate-700/40 border-slate-500/60 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700',
  };

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <div className={`rounded-2xl p-8 mb-10 animate-fade-in-up ${isDark ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg'}`}>
          <h1 className="text-4xl font-bold leading-tight mb-2">{t.welcome}, {user?.fullName}!</h1>
          <p className="text-white/90">{t.subtitle}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up ${styles.glass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-semibold ${styles.muted}`}>{t.stats.pending}</span>
            </div>
            <p className={`text-4xl font-bold ${styles.heading}`}>{pendingBookings}</p>
            <p className={`text-sm mt-2 ${styles.muted}`}>{t.bookingRequests}</p>
          </div>

          <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-100 ${styles.glass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-semibold ${styles.muted}`}>{t.stats.active}</span>
            </div>
            <p className={`text-4xl font-bold ${styles.heading}`}>{activeBookings}</p>
            <p className={`text-sm mt-2 ${styles.muted}`}>{t.classesBooked}</p>
          </div>

          <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-200 ${styles.glass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-semibold ${styles.muted}`}>{t.stats.total}</span>
            </div>
            <p className={`text-4xl font-bold ${styles.heading}`}>{bookings.length}</p>
            <p className={`text-sm mt-2 ${styles.muted}`}>{t.allBookings}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Link
            href="/tutors"
            className={`group rounded-2xl shadow-lg p-8 transition hover:shadow-2xl animate-fade-in-up delay-300 ${isDark ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white' : 'btn-gradient text-white'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">{t.discoverTitle}</h3>
                <p className="text-white/90">{t.discoverDesc}</p>
              </div>
              <BookOpen className="w-8 h-8 text-white/70 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          <Link
            href="/dashboard/student/profile"
            className={`group rounded-2xl shadow-lg p-8 transition hover:shadow-2xl border animate-fade-in-up delay-400 ${styles.glass}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-2xl font-bold ${styles.heading} mb-2`}>{t.profileTitle}</h3>
                <p className={`${styles.muted}`}>{t.profileDesc}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className={`rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-500 ${styles.glass}`}>
          <h2 className={`text-2xl font-bold mb-6 ${styles.heading}`}>{t.recent}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking, idx) => (
                <div
                  key={booking.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 border animate-fade-in-up delay-${100 + idx * 100} ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                >
                  <div>
                    <p className={`font-semibold ${styles.heading}`}>{booking.class?.title || `Booking ${booking.id.slice(0, 8)}`}</p>
                    <p className={`text-sm ${styles.muted}`}>{booking.isTrial ? t.trial : t.regular}</p>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold border ${
                      booking.status === 'CONFIRMED'
                        ? badgeStyles.confirmed
                        : booking.status === 'PENDING'
                          ? badgeStyles.pending
                          : badgeStyles.default
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${styles.muted}`}>
              {t.none}{' '}
              <Link href="/tutors" className="text-gradient font-semibold hover:underline">
                {t.findTutor}
              </Link>.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
