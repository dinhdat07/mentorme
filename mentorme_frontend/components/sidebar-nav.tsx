'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from './auth-provider';

export const SidebarNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthContext();

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'STUDENT') {
      return [
        { label: 'Dashboard', href: '/dashboard/student' },
        { label: 'Find Tutors', href: '/tutors' },
        { label: 'My Bookings', href: '/dashboard/student/bookings' },
        { label: 'Profile', href: '/dashboard/student/profile' },
      ];
    }

    if (user.role === 'TUTOR') {
      return [
        { label: 'Dashboard', href: '/dashboard/tutor' },
        { label: 'My Classes', href: '/dashboard/tutor/classes' },
        { label: 'Bookings', href: '/dashboard/tutor/bookings' },
        { label: 'Profile', href: '/dashboard/tutor/profile' },
        { label: 'Reviews', href: '/dashboard/tutor/reviews' },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Dashboard', href: '/dashboard/admin' },
      ];
    }

    return [];
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">Mentor Me</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {getNavItems().map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg font-medium transition ${
              pathname === item.href
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
