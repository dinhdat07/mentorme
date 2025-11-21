'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

export default function TutorBookingsPage() {
  const { bookings, isLoading, mutate } = useBookings();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/confirm`, {});
      mutate();
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/reject`, {
        reason: 'Rejected by tutor',
      });
      mutate();
    } catch (error) {
      console.error('Failed to reject booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await apiClient.patch(`/api/bookings/${bookingId}/complete`, {});
      mutate();
    } catch (error) {
      console.error('Failed to complete booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const groupedBookings = {
    PENDING: bookings.filter((b) => b.status === 'PENDING'),
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED'),
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED'),
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED'),
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Manage Bookings
          </h1>
          <p className="text-slate-400">Review and manage your student bookings</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Bookings */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-400" />
                Pending Requests ({groupedBookings.PENDING.length})
              </h2>
              {groupedBookings.PENDING.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.PENDING.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 hover:border-yellow-500/60 transition duration-300 shadow-lg hover:shadow-yellow-500/10 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
                            {booking.isTrial ? 'Trial Class Request' : 'Class Booking'}
                          </h3>
                          <p className="text-sm text-slate-300 mb-1">{booking.requestedHoursPerWeek} hours per week</p>
                          <p className="text-sm text-slate-400">
                            Start: {new Date(booking.startDateExpected).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/30 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/50">
                          PENDING
                        </span>
                      </div>
                      {booking.noteFromStudent && (
                        <div className="text-sm text-slate-300 mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-400" />
                          <span>Student Note: {booking.noteFromStudent}</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className="flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition duration-300 disabled:opacity-50 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processingId === booking.id ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className="flex-1 px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg font-medium transition duration-300 disabled:opacity-50 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === booking.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">No pending bookings</p>
              )}
            </div>

            {/* Confirmed Bookings */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Confirmed Bookings ({groupedBookings.CONFIRMED.length})
              </h2>
              {groupedBookings.CONFIRMED.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.CONFIRMED.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 hover:border-green-500/60 transition duration-300 shadow-lg hover:shadow-green-500/10 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full" />
                            Confirmed Class
                          </h3>
                          <p className="text-sm text-slate-300 mb-1">{booking.requestedHoursPerWeek} hours per week</p>
                          <p className="text-sm text-slate-400">
                            Start: {new Date(booking.startDateExpected).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-sm font-medium border border-green-500/50">
                          CONFIRMED
                        </span>
                      </div>
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={processingId === booking.id}
                        className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                      >
                        {processingId === booking.id ? 'Completing...' : 'Mark as Completed'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">No confirmed bookings</p>
              )}
            </div>

            {/* Completed Bookings */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-slate-400" />
                Completed ({groupedBookings.COMPLETED.length})
              </h2>
              {groupedBookings.COMPLETED.length > 0 ? (
                <div className="space-y-3">
                  {groupedBookings.COMPLETED.slice(0, 5).map((booking, idx) => (
                    <div
                      key={booking.id}
                      className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition duration-300 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <p className="font-medium text-white">Booking {booking.id.slice(0, 8)}</p>
                      <p className="text-sm text-slate-400">Completed on {new Date(booking.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">No completed bookings</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
