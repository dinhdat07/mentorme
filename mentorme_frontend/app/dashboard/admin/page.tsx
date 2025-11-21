'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { usePendingTutors } from '@/hooks/usePendingTutors';
import { CheckCircle, XCircle, Users, BookOpen, BookMarked } from 'lucide-react';

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
      <div className="min-h-screen p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-white/60">Manage platform activity and tutor applications</p>
        </div>

        <div className="flex gap-4 mb-8 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20">
          {[
            { id: 'pending-tutors', label: 'Pending Tutors', icon: Users, count: pendingTutors.length },
            { id: 'bookings', label: 'Bookings', icon: BookOpen, count: bookings?.length || 0 },
            { id: 'classes', label: 'Classes', icon: BookMarked, count: classes?.length || 0 },
          ].map((tabItem) => {
            const IconComponent = tabItem.icon;
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg flex-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <IconComponent size={18} />
                <span>{tabItem.label}</span>
                <span className="ml-auto text-sm opacity-75">({tabItem.count})</span>
              </button>
            );
          })}
        </div>

        {/* Pending Tutors Tab */}
        {tab === 'pending-tutors' && (
          <div>
            {tutorsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin" style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}></div>
                </div>
              </div>
            ) : pendingTutors.length > 0 ? (
              <div className="space-y-4">
                {pendingTutors.map((tutor, idx) => (
                  <div
                    key={tutor.id}
                    className="animate-fade-in bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {tutor.userId}
                        </h3>
                        {tutor.bio && <p className="text-white/70 mb-2 line-clamp-2">{tutor.bio}</p>}
                        <div className="space-y-1 text-sm text-white/60">
                          {tutor.education && <p>Education: {tutor.education.substring(0, 60)}...</p>}
                          {tutor.city && <p>Location: {tutor.city}</p>}
                          <p>Experience: {tutor.yearsOfExperience} years</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/50 mb-2">
                          Applied: {new Date(tutor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, true)}
                        disabled={processingId === tutor.id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                      >
                        <CheckCircle size={16} />
                        {processingId === tutor.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleVerifyTutor(tutor.id, false)}
                        disabled={processingId === tutor.id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                      >
                        <XCircle size={16} />
                        {processingId === tutor.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 text-center">
                <p className="text-white/60 text-lg">No pending tutor approvals</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin" style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}></div>
                </div>
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Student</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tutor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Hours/Week</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {bookings.map((booking: any, idx: number) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-white/5 transition-colors animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td className="px-6 py-4 text-sm text-white/70">{booking.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-white/70">{booking.studentId.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-white/70">{booking.tutorId.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'CONFIRMED' ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50' :
                            booking.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/50' :
                            booking.status === 'COMPLETED' ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border border-blue-500/50' :
                            'bg-white/10 text-white/70 border border-white/20'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/70">{booking.requestedHoursPerWeek}</td>
                        <td className="px-6 py-4 text-sm text-white/70">
                          {new Date(booking.startDateExpected).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 text-center">
                <p className="text-white/60 text-lg">No bookings found</p>
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {tab === 'classes' && (
          <div>
            {classesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin" style={{ maskImage: 'radial-gradient(circle, transparent 60%, black)' }}></div>
                </div>
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls: any, idx: number) => (
                  <div
                    key={cls.id}
                    className="animate-fade-in bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{cls.title}</h3>
                        <p className="text-sm text-white/70 mb-2 line-clamp-1">{cls.description}</p>
                        <div className="flex gap-4 text-sm text-white/60">
                          <span>Tutor: {cls.tutorId.slice(0, 8)}</span>
                          <span>${cls.pricePerHour}/hour</span>
                          <span>{cls.locationType}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                        cls.status === 'PUBLISHED' ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50' :
                        cls.status === 'DRAFT' ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/50' :
                        'bg-white/10 text-white/70 border border-white/20'
                      }`}>
                        {cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 text-center">
                <p className="text-white/60 text-lg">No classes found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
