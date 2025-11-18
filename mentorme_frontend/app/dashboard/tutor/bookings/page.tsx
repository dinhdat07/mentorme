'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { apiClient } from '@/lib/api-client';

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Bookings</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Bookings */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Requests ({groupedBookings.PENDING.length})</h2>
              {groupedBookings.PENDING.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.PENDING.map((booking) => (
                    <div key={booking.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {booking.isTrial ? 'Trial Class Request' : 'Class Booking'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">{booking.requestedHoursPerWeek} hours per week</p>
                          <p className="text-sm text-gray-600">Start: {new Date(booking.startDateExpected).toLocaleDateString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">PENDING</span>
                      </div>
                      {booking.noteFromStudent && (
                        <p className="text-sm text-gray-700 mb-4 p-3 bg-white rounded">
                          Student Note: {booking.noteFromStudent}
                        </p>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {processingId === booking.id ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {processingId === booking.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No pending bookings</p>
              )}
            </div>

            {/* Confirmed Bookings */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirmed Bookings ({groupedBookings.CONFIRMED.length})</h2>
              {groupedBookings.CONFIRMED.length > 0 ? (
                <div className="space-y-4">
                  {groupedBookings.CONFIRMED.map((booking) => (
                    <div key={booking.id} className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmed Class</h3>
                          <p className="text-sm text-gray-600 mb-1">{booking.requestedHoursPerWeek} hours per week</p>
                          <p className="text-sm text-gray-600">Start: {new Date(booking.startDateExpected).toLocaleDateString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">CONFIRMED</span>
                      </div>
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={processingId === booking.id}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {processingId === booking.id ? 'Completing...' : 'Mark as Completed'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No confirmed bookings</p>
              )}
            </div>

            {/* Completed Bookings */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed ({groupedBookings.COMPLETED.length})</h2>
              {groupedBookings.COMPLETED.length > 0 ? (
                <div className="space-y-3">
                  {groupedBookings.COMPLETED.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-900">Booking {booking.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">Completed on {new Date(booking.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No completed bookings</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
