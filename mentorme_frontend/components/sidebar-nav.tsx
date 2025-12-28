'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from './auth-provider';
import { LogOut, LayoutDashboard, Users, BookOpen, Star, Settings, Sun, Moon, Bell } from 'lucide-react';
import { useUISettings } from './ui-settings-context';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

interface SidebarNavProps {
  theme?: ThemeMode;
}

const navTranslations: Record<Language, Record<string, string>> = {
  vi: {
    dashboard: 'Bảng điều khiển',
    findTutors: 'Tìm gia sư',
    myBookings: 'Lịch học',
    myClasses: 'Lớp của tôi',
    calendar: 'Lịch',
    profile: 'Hồ sơ',
    myClasses: 'Lớp của tôi',
    bookings: 'Lịch đặt',
  reviews: 'Đánh giá',
  logout: 'Đăng xuất',
  admin: 'Bảng điều khiển',
  notifications: 'Thông báo',
  tutorVerifications: 'Duyệt xác minh',
  verification: 'Xác minh',
  },
  en: {
    dashboard: 'Dashboard',
    findTutors: 'Find Tutors',
    myBookings: 'My Bookings',
    myClasses: 'My Classes',
    calendar: 'Calendar',
    profile: 'Profile',
    myClasses: 'My Classes',
    bookings: 'Bookings',
  reviews: 'Reviews',
  logout: 'Logout',
  admin: 'Dashboard',
  notifications: 'Notifications',
  tutorVerifications: 'Tutor Verifications',
  verification: 'Verification',
  },
};

export const SidebarNav = ({ theme }: SidebarNavProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthContext();
  const { theme: ctxTheme, language, setLanguage, setTheme } = useUISettings();
  const resolvedTheme = theme ?? ctxTheme;
  const t = navTranslations[language];
  const { data: notifData } = useSWR(user ? '/api/notifications/me' : null, apiClient.get, { refreshInterval: 30000 });
  const unread = notifData?.unread ?? 0;

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'STUDENT') {
      return [
        { label: t.dashboard, href: '/dashboard/student', icon: LayoutDashboard },
        { label: t.findTutors, href: '/tutors', icon: Users },
        { label: t.myBookings, href: '/dashboard/student/bookings', icon: BookOpen },
        { label: t.myClasses, href: '/dashboard/student/my-classes', icon: BookOpen },
        { label: t.calendar, href: '/dashboard/student/calendar', icon: BookOpen },
        { label: t.notifications, href: '/notifications', icon: Bell },
        { label: t.profile, href: '/dashboard/student/profile', icon: Settings },
      ];
    }

    if (user.role === 'TUTOR') {
      return [
        { label: t.dashboard, href: '/dashboard/tutor', icon: LayoutDashboard },
        { label: t.myClasses, href: '/dashboard/tutor/classes', icon: BookOpen },
        { label: t.bookings, href: '/dashboard/tutor/bookings', icon: Users },
        { label: t.calendar, href: '/dashboard/tutor/calendar', icon: BookOpen },
        { label: t.notifications, href: '/notifications', icon: Bell },
        { label: t.verification, href: '/dashboard/tutor/verification', icon: Settings },
        { label: t.profile, href: '/dashboard/tutor/profile', icon: Settings },
        { label: t.reviews, href: '/dashboard/tutor/reviews', icon: Star },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: t.admin, href: '/dashboard/admin', icon: LayoutDashboard },
        { label: t.tutorVerifications, href: '/dashboard/admin/verifications', icon: Users },
        { label: t.notifications, href: '/notifications', icon: Bell },
      ];
    }

    return [];
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div
      className={`w-64 h-screen flex flex-col border-r shadow-2xl transition-colors duration-300 ${
        resolvedTheme === 'dark'
          ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-700/50'
          : 'bg-gradient-to-b from-white via-slate-50 to-white border-slate-200'
      }`}
    >
      <div className={`p-6 border-b transition-colors duration-300 ${resolvedTheme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/mentorme_logo.png" alt="MentorMe logo" width={44} height={44} className="rounded-md" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mentor Me
          </h1>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showBadge = item.href === '/notifications' && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : resolvedTheme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {showBadge && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">{unread}</span>}
              {isActive && <div className="ml-auto w-1 h-6 bg-white rounded-full" />}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 space-y-3 border-t transition-colors duration-300 ${resolvedTheme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <div className={`flex flex-col gap-2`}>
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${resolvedTheme === 'dark' ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
            <span className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-700'}`}>Theme</span>
            <div className="flex gap-1">
              <button
                onClick={() => setTheme('light')}
                aria-label="Light mode"
                className={`p-2 rounded-md transition ${resolvedTheme === 'light' ? 'bg-yellow-100 text-amber-600 shadow' : resolvedTheme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                aria-label="Dark mode"
                className={`p-2 rounded-md transition ${resolvedTheme === 'dark' ? 'bg-purple-600/80 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${resolvedTheme === 'dark' ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
            <span className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-700'}`}>Language</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('vi')}
                aria-label="Chọn tiếng Việt"
                className={`px-2 py-1 rounded-md text-base transition ${language === 'vi' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow' : resolvedTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                🇻🇳
              </button>
              <button
                onClick={() => setLanguage('en')}
                aria-label="Switch to English"
                className={`px-2 py-1 rounded-md text-base transition ${language === 'en' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow' : resolvedTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                🇺🇸
              </button>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border backdrop-blur-sm transition-colors duration-300 ${
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/50'
              : 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200'
          }`}
        >
          <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{user?.fullName}</p>
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition duration-300 border ${
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 border-red-500/30 hover:border-red-500/50'
              : 'bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-500 border-red-200 hover:border-red-300'
          }`}
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </div>
    </div>
  );
};
