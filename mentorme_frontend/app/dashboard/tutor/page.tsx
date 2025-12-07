'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { useAuthContext } from '@/components/auth-provider';
import { Star, Award, TrendingUp, Clock } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    welcome: 'Chào mừng trở lại',
    subtitle: 'Quản lý lớp học và kết nối học viên',
    trust: 'Điểm tin cậy',
    rating: 'Đánh giá',
    completed: 'Hoàn thành',
    pending: 'Đang chờ',
    reputation: 'Uy tín của bạn',
    avg: 'Điểm trung bình',
    classesDone: 'Lớp đã hoàn tất',
    bookingRequests: 'Yêu cầu đặt lịch',
    createClass: 'Tạo lớp mới',
    createDesc: 'Thêm lớp học mới',
    profile: 'Cập nhật hồ sơ',
    profileDesc: 'Nâng cấp thông tin gia sư',
    manage: 'Quản lý lịch',
    manageDesc: 'Yêu cầu đang chờ',
    myClasses: 'Lớp của tôi',
    pendingBookings: 'Lịch đang chờ',
    noClasses: 'Chưa có lớp nào.',
    createOne: 'Tạo ngay',
    noPending: 'Không có lịch đang chờ',
  },
  en: {
    welcome: 'Welcome back',
    subtitle: 'Manage classes and connect with students',
    trust: 'Trust Score',
    rating: 'Rating',
    completed: 'Completed',
    pending: 'Pending',
    reputation: 'Your reputation',
    avg: 'Average rating',
    classesDone: 'Classes completed',
    bookingRequests: 'Booking requests',
    createClass: 'Create New Class',
    createDesc: 'Add a new class listing',
    profile: 'Update Profile',
    profileDesc: 'Enhance your tutor information',
    manage: 'Manage Bookings',
    manageDesc: 'Pending request(s)',
    myClasses: 'My Classes',
    pendingBookings: 'Pending Bookings',
    noClasses: 'No classes yet.',
    createOne: 'Create one',
    noPending: 'No pending bookings',
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

export default function TutorDashboard() {
  const { user } = useAuthContext();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { profile, isLoading: profileLoading } = useTutorProfile();
  const { classes, isLoading: classesLoading } = useTutorClasses();
  const { theme, language } = useUISettings();

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const t = translations[language];
  const styles = themeStyles[theme];
  const isDark = theme === 'dark';

  const badgeStyles = {
    published: isDark ? 'bg-green-500/30 border-green-400/60 text-green-100' : 'bg-green-100 border-green-300 text-green-700',
    draft: isDark ? 'bg-yellow-500/30 border-yellow-400/60 text-yellow-100' : 'bg-yellow-100 border-yellow-300 text-yellow-700',
    default: isDark ? 'bg-slate-700/40 border-slate-500/60 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700',
  };

  if (profileLoading) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-purple-600 to-pink-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <div className={`rounded-2xl p-8 mb-10 animate-fade-in-up ${isDark ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg'}`}>
          <h1 className="text-4xl font-bold leading-tight mb-2">
            {t.welcome}, {user?.fullName}!
          </h1>
          <p className="text-white/90">{t.subtitle}</p>
        </div>

        {/* Trust & Reputation */}
        {profile && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up ${styles.glass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${styles.muted}`}>{t.trust}</span>
              </div>
              <p className={`text-4xl font-bold ${styles.heading}`}>{profile.trustScore.toFixed(1)}</p>
              <p className={`text-sm mt-2 ${styles.muted}`}>{t.reputation}</p>
            </div>

            <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-100 ${styles.glass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${styles.muted}`}>{t.rating}</span>
              </div>
              <p className={`text-4xl font-bold ${styles.heading}`}>{profile.averageRating.toFixed(1)}★</p>
              <p className={`text-sm mt-2 ${styles.muted}`}>{t.avg}</p>
            </div>

            <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-200 ${styles.glass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${styles.muted}`}>{t.completed}</span>
              </div>
              <p className={`text-4xl font-bold ${styles.heading}`}>{profile.totalCompletedBookings}</p>
              <p className={`text-sm mt-2 ${styles.muted}`}>{t.classesDone}</p>
            </div>

            <div className={`group rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-300 ${styles.glass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${styles.muted}`}>{t.pending}</span>
              </div>
              <p className={`text-4xl font-bold ${styles.heading}`}>{pendingBookings}</p>
              <p className={`text-sm mt-2 ${styles.muted}`}>{t.bookingRequests}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/tutor/classes/new"
            className={`group rounded-2xl shadow-lg p-6 transition hover:shadow-2xl animate-fade-in-up delay-400 ${isDark ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white' : 'btn-gradient text-white'}`}
          >
            <h3 className="text-xl font-bold mb-2">{t.createClass}</h3>
            <p className="text-white/90">{t.createDesc}</p>
          </Link>
          <Link
            href="/dashboard/tutor/profile"
            className={`group rounded-2xl shadow-lg p-6 transition hover:shadow-2xl border animate-fade-in-up delay-500 ${styles.glass}`}
          >
            <h3 className={`text-xl font-bold mb-2 ${styles.heading}`}>{t.profile}</h3>
            <p className={`${styles.muted}`}>{t.profileDesc}</p>
          </Link>
          <Link
            href="/dashboard/tutor/bookings"
            className={`group rounded-2xl shadow-lg p-6 transition hover:shadow-2xl border animate-fade-in-up delay-600 ${styles.glass}`}
          >
            <h3 className={`text-xl font-bold mb-2 ${styles.heading}`}>{t.manage}</h3>
            <p className={`${styles.muted}`}>{pendingBookings} {t.manageDesc}</p>
          </Link>
        </div>

        {/* Classes Overview */}
        <div className="grid grid-cols-2 gap-8">
          <div className={`rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-500 ${styles.glass}`}>
            <h2 className={`text-2xl font-bold mb-6 ${styles.heading}`}>{t.myClasses}</h2>
            {classesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-3">
                {classes.slice(0, 4).map((cls, idx) => (
                  <Link
                    key={cls.id}
                    href={`/dashboard/tutor/classes/${cls.id}`}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 border group animate-fade-in-up delay-${100 + idx * 100} ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                  >
                    <div>
                      <p className={`font-semibold transition-colors ${styles.heading}`}>{cls.title}</p>
                      <p className={`text-sm ${styles.muted}`}>{cls.pricePerHour.toLocaleString('vi-VN')} ₫/giờ</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        cls.status === 'PUBLISHED'
                          ? badgeStyles.published
                          : cls.status === 'DRAFT'
                            ? badgeStyles.draft
                            : badgeStyles.default
                      }`}
                    >
                      {cls.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={`${styles.muted}`}>
                {t.noClasses}{' '}
                <Link href="/dashboard/tutor/classes/new" className="text-gradient font-semibold hover:underline">
                  {t.createOne}
                </Link>.
              </p>
            )}
          </div>

          <div className={`rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up delay-600 ${styles.glass}`}>
            <h2 className={`text-2xl font-bold mb-6 ${styles.heading}`}>{t.pendingBookings}</h2>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
              </div>
            ) : bookings.filter((b) => b.status === 'PENDING').length > 0 ? (
              <div className="space-y-3">
                {bookings.filter((b) => b.status === 'PENDING').slice(0, 4).map((booking, idx) => (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-lg border group transition-all animate-fade-in-up delay-${100 + idx * 100} ${
                      isDark ? 'bg-yellow-500/10 border-yellow-400/40 hover:bg-yellow-500/20' : 'bg-yellow-50 border-yellow-200 hover:bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${styles.heading}`}>{booking.class?.title || `Booking ${booking.id.slice(0, 8)}`}</p>
                    <p className={`text-sm ${styles.muted}`}>{booking.requestedHoursPerWeek} hours/week</p>
                    <Link
                      href={`/dashboard/tutor/bookings/${booking.id}`}
                      className={`${isDark ? 'text-purple-200 hover:text-purple-100' : 'text-purple-600 hover:text-purple-700'} text-sm transition-colors mt-2 inline-block`}
                    >
                      Review Request →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${styles.muted}`}>{t.noPending}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
