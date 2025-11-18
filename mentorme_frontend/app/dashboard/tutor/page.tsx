'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { useAuthContext } from '@/components/auth-provider';

export default function TutorDashboard() {
  const { user } = useAuthContext();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { profile, isLoading: profileLoading } = useTutorProfile();
  const { classes, isLoading: classesLoading } = useTutorClasses();

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  if (profileLoading) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user?.fullName}!</h1>
        <p className="text-gray-600 mb-8">Manage your tutor profile and classes</p>

        {/* Trust & Reputation */}
        {profile && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Trust Score</p>
              <p className="text-3xl font-bold text-blue-600">{profile.trustScore.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-600">{profile.averageRating.toFixed(1)}★</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Completed Bookings</p>
              <p className="text-3xl font-bold text-green-600">{profile.totalCompletedBookings}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Bookings</p>
              <p className="text-3xl font-bold text-purple-600">{pendingBookings}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/tutor/classes/new"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 transition"
          >
            <h3 className="text-xl font-bold mb-2">Create New Class</h3>
            <p className="text-blue-100">Add a new class listing</p>
          </Link>
          <Link
            href="/dashboard/tutor/profile"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-6 transition"
          >
            <h3 className="text-xl font-bold mb-2">Update Profile</h3>
            <p className="text-indigo-100">Update your tutor information</p>
          </Link>
          <Link
            href="/dashboard/tutor/bookings"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 transition"
          >
            <h3 className="text-xl font-bold mb-2">Manage Bookings</h3>
            <p className="text-green-100">{pendingBookings} pending request(s)</p>
          </Link>
        </div>

        {/* Classes Overview */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Classes</h2>
            {classesLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : classes.length > 0 ? (
              <div className="space-y-3">
                {classes.slice(0, 4).map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/dashboard/tutor/classes/${cls.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{cls.title}</p>
                      <p className="text-sm text-gray-500">${cls.pricePerHour}/hour</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cls.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      cls.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {cls.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No classes yet. <Link href="/dashboard/tutor/classes/new" className="text-blue-600 hover:underline">Create one</Link>.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Bookings</h2>
            {bookingsLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : bookings.filter((b) => b.status === 'PENDING').length > 0 ? (
              <div className="space-y-3">
                {bookings.filter((b) => b.status === 'PENDING').slice(0, 4).map((booking) => (
                  <div key={booking.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-gray-900">Booking {booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{booking.requestedHoursPerWeek} hours/week</p>
                    <Link
                      href={`/dashboard/tutor/bookings/${booking.id}`}
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Review Request →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pending bookings</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
