'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useBookings } from '@/hooks/useBookings';
import { useAuthContext } from '@/components/auth-provider';
import { BookOpen, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { bookings, isLoading } = useBookings();
  const { user } = useAuthContext();

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-white/90">Continue your learning journey with expert tutors</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-white/70">Pending</span>
            </div>
            <p className="text-4xl font-bold text-white">{pendingBookings}</p>
            <p className="text-white/70 text-sm mt-2">Booking requests</p>
          </div>

          <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-white/70">Active</span>
            </div>
            <p className="text-4xl font-bold text-white">{activeBookings}</p>
            <p className="text-white/70 text-sm mt-2">Classes booked</p>
          </div>

          <div className="group card-hover glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-white/70">Total</span>
            </div>
            <p className="text-4xl font-bold text-white">{bookings.length}</p>
            <p className="text-white/70 text-sm mt-2">All bookings</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Link
            href="/tutors"
            className="group btn-gradient text-white rounded-2xl shadow-lg p-8 transition hover:shadow-2xl animate-fade-in-up delay-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Discover Tutors</h3>
                <p className="text-white/90">Browse and find your perfect tutor</p>
              </div>
              <BookOpen className="w-8 h-8 text-white/50 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          <Link
            href="/dashboard/student/profile"
            className="group glass text-white rounded-2xl shadow-lg p-8 transition hover:shadow-2xl border border-white/20 animate-fade-in-up delay-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Your Profile</h3>
                <p className="text-white/70">Update your learning preferences</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white/50 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="glass rounded-2xl p-6 border border-white/20 backdrop-blur-sm animate-fade-in-up delay-500">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Bookings</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking, idx) => (
                <div key={booking.id} className={`flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/10 animate-fade-in-up delay-${100 + idx * 100}`}>
                  <div>
                    <p className="font-semibold text-white">Booking {booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-white/70">{booking.isTrial ? 'Trial Class' : 'Regular Class'}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold backdrop-blur-sm border ${
                    booking.status === 'CONFIRMED' ? 'bg-green-500/30 border-green-400/50 text-green-200' :
                    booking.status === 'PENDING' ? 'bg-yellow-500/30 border-yellow-400/50 text-yellow-200' :
                    'bg-gray-500/30 border-gray-400/50 text-gray-200'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70">No bookings yet. <Link href="/tutors" className="text-purple-300 hover:text-purple-200 underline">Find a tutor</Link>.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
