'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { useAuthContext } from '@/components/auth-provider';
import { Star, Award, TrendingUp, Clock } from 'lucide-react';

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
        <div className="p-8 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-purple-600 to-pink-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-white/90">Manage your classes and connect with students</p>
        </div>

        {/* Trust & Reputation */}
        {profile && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/70">Trust Score</span>
              </div>
              <p className="text-4xl font-bold text-white">{profile.trustScore.toFixed(1)}</p>
              <p className="text-white/70 text-sm mt-2">Your reputation</p>
            </div>

            <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/70">Rating</span>
              </div>
              <p className="text-4xl font-bold text-white">{profile.averageRating.toFixed(1)}★</p>
              <p className="text-white/70 text-sm mt-2">Average rating</p>
            </div>

            <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/70">Completed</span>
              </div>
              <p className="text-4xl font-bold text-white">{profile.totalCompletedBookings}</p>
              <p className="text-white/70 text-sm mt-2">Classes completed</p>
            </div>

            <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/70">Pending</span>
              </div>
              <p className="text-4xl font-bold text-white">{pendingBookings}</p>
              <p className="text-white/70 text-sm mt-2">Booking requests</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/tutor/classes/new"
            className="group btn-gradient text-white rounded-2xl shadow-lg p-6 transition hover:shadow-2xl animate-fade-in-up delay-400"
          >
            <h3 className="text-xl font-bold mb-2">Create New Class</h3>
            <p className="text-white/90">Add a new class listing</p>
          </Link>
          <Link
            href="/dashboard/tutor/profile"
            className="group glass text-white rounded-2xl shadow-lg p-6 transition hover:shadow-2xl border border-white/20 animate-fade-in-up delay-500"
          >
            <h3 className="text-xl font-bold mb-2">Update Profile</h3>
            <p className="text-white/70">Enhance your tutor information</p>
          </Link>
          <Link
            href="/dashboard/tutor/bookings"
            className="group glass text-white rounded-2xl shadow-lg p-6 transition hover:shadow-2xl border border-white/20 animate-fade-in-up delay-600"
          >
            <h3 className="text-xl font-bold mb-2">Manage Bookings</h3>
            <p className="text-white/70">{pendingBookings} pending request(s)</p>
          </Link>
        </div>

        {/* Classes Overview */}
        <div className="grid grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-500">
            <h2 className="text-2xl font-bold text-white mb-6">My Classes</h2>
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
                    className={`flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/10 group animate-fade-in-up delay-${100 + idx * 100}`}
                  >
                    <div>
                      <p className="font-semibold text-white group-hover:text-pink-200 transition-colors">{cls.title}</p>
                      <p className="text-sm text-white/70">${cls.pricePerHour}/hour</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                      cls.status === 'PUBLISHED' ? 'bg-green-500/30 border-green-400/50 text-green-200' :
                      cls.status === 'DRAFT' ? 'bg-yellow-500/30 border-yellow-400/50 text-yellow-200' :
                      'bg-gray-500/30 border-gray-400/50 text-gray-200'
                    }`}>
                      {cls.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/70">No classes yet. <Link href="/dashboard/tutor/classes/new" className="text-purple-300 hover:text-purple-200 underline">Create one</Link>.</p>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-600">
            <h2 className="text-2xl font-bold text-white mb-6">Pending Bookings</h2>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
              </div>
            ) : bookings.filter((b) => b.status === 'PENDING').length > 0 ? (
              <div className="space-y-3">
                {bookings.filter((b) => b.status === 'PENDING').slice(0, 4).map((booking, idx) => (
                  <div key={booking.id} className={`p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/50 group hover:bg-yellow-500/30 transition-all animate-fade-in-up delay-${100 + idx * 100}`}>
                    <p className="font-semibold text-white">Booking {booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-white/70">{booking.requestedHoursPerWeek} hours/week</p>
                    <Link
                      href={`/dashboard/tutor/bookings/${booking.id}`}
                      className="text-sm text-purple-300 hover:text-purple-200 transition-colors mt-2 inline-block"
                    >
                      Review Request →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70">No pending bookings</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
