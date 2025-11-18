'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { usePendingTutors } from '@/hooks/usePendingTutors';

export default function AdminDashboard() {
  const { tutors: pendingTutors, isLoading: tutorsLoading, mutate: mutateTutors } = usePendingTutors();
  const [tab, setTab] = useState('pending-tutors');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useSWR(
    tab === 'bookings' ? '/api/admin/bookings' : null,
    apiClient.get
  );

  const { data: classes, isLoading: classesLoading } = useSWR(
    tab === 'classes' ? '/api/admin/classes' : null,
    apiClient.get
  );

  const handleVerifyTutor = async (tutorId: string, approved: boolean) => {
    try {
      setProcessingId(tutorId);
      await apiClient.patch(`/api/admin/tutors/${tutorId}/verify`, {
        approved,
        note: approved ? 'Approved by admin' : 'Rejected by admin',
      });
      mutateTutors();
    } catch (error) {
      console.error('Failed to verify tutor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBanTutor = async (tutorId: string, banned: boolean) => {
    try {
      setProcessingId(tutorId);
      await apiClient.patch(`/api/admin/tutors/${tutorId}/ban`, {
        banned,
      });
      mutateTutors();
    } catch (error) {
      console.error('Failed to ban tutor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setTab('pending-tutors')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              tab === 'pending-tutors'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Pending Tutors ({pendingTutors.length})
          </button>
          <button
            onClick={() => setTab('bookings')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              tab === 'bookings'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setTab('classes')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              tab === 'classes'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Classes
          </button>
        </div>

        {/* Pending Tutors Tab */}
        {tab === 'pending-tutors' && (
          <div>
            {tutorsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : pendingTutors.length > 0 ? (
              <div className="space-y-4">
                {pendingTutors.map((tutor) => (
                  <div key={tutor.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {tutor.userId}
                        </h3>
                        {tutor.bio && <p className="text-gray-600 mb-2 line-clamp-2">{tutor.bio}</p>}
                        <div className="space-y-1 text-sm text-gray-600">
                          {tutor.education && <p>Education: {tutor.education.substring(0, 60)}...</p>}
                          {tutor.city && <p>Location: {tutor.city}</p>}
                          <p>Experience: {tutor.yearsOfExperience} years</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">
                          Applied: {new Date(tutor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, true)}
                        disabled={processingId === tutor.id}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {processingId === tutor.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, false)}
                        disabled={processingId === tutor.id}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {processingId === tutor.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">No pending tutor approvals</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tutor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hours/Week</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.studentId.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.tutorId.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.requestedHoursPerWeek}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.startDateExpected).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">No bookings found</p>
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {tab === 'classes' && (
          <div>
            {classesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls: any) => (
                  <div key={cls.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{cls.description}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Tutor: {cls.tutorId.slice(0, 8)}</span>
                          <span>${cls.pricePerHour}/hour</span>
                          <span>{cls.locationType}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        cls.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        cls.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">No classes found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
