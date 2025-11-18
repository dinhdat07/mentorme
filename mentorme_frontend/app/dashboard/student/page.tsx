'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useAuthContext } from '@/components/auth-provider';

export default function StudentDashboard() {
  const { bookings, isLoading } = useBookings();
  const { user } = useAuthContext();

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user?.fullName}!</h1>
        <p className="text-gray-600 mb-8">Manage your learning journey</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
            <p className="text-3xl font-bold text-blue-600">{pendingBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Active Classes</p>
            <p className="text-3xl font-bold text-green-600">{activeBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-purple-600">{bookings.length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6">
          <Link
            href="/tutors"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 transition"
          >
            <h3 className="text-xl font-bold mb-2">Find Tutors</h3>
            <p className="text-blue-100">Browse qualified tutors in your area</p>
          </Link>
          <Link
            href="/dashboard/student/profile"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-6 transition"
          >
            <h3 className="text-xl font-bold mb-2">Update Profile</h3>
            <p className="text-indigo-100">Complete your learning profile</p>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Booking {booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{booking.isTrial ? 'Trial Class' : 'Regular Class'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No bookings yet. <Link href="/tutors" className="text-blue-600 hover:underline">Find a tutor</Link>.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
