'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { apiClient } from '@/lib/api-client';
import { Calendar, Clock, Trash2 } from 'lucide-react';

export default function StudentBookingsPage() {
  const { bookings, isLoading, mutate } = useBookings();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by student',
      });
      mutate();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            My Bookings
          </h1>
          <p className="text-slate-400">Manage and track your tutoring sessions</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <div
                key={booking.id}
                className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition duration-300 shadow-lg hover:shadow-purple-500/10 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      Booking {booking.id.slice(0, 8)}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="text-lg">{booking.isTrial ? '📚' : '👨‍🎓'}</span>
                        {booking.isTrial ? 'Trial Class' : 'Regular Class'}
                      </p>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date: {new Date(booking.startDateExpected).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {booking.requestedHoursPerWeek} hours per week
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 transition duration-300 ${
                      booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                      booking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                      booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                    }`}>
                      {booking.status}
                    </span>
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="block w-full mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition duration-300 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-12 text-center border border-purple-500/20 animate-fade-in">
            <p className="text-slate-400 text-lg mb-6">No bookings yet</p>
            <a
              href="/tutors"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition duration-300 shadow-lg shadow-purple-500/30"
            >
              Find Tutors
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
