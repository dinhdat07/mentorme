'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import useSWR from 'swr';
import { TutorProfile, Class } from '@/lib/types';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuthContext } from '@/components/auth-provider';

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const tutorId = params.id as string;

  const { data: tutor, isLoading: tutorLoading } = useSWR<TutorProfile>(
    `/api/tutors/${tutorId}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const { data: classes, isLoading: classesLoading } = useSWR<Class[]>(
    `/api/classes?tutorId=${tutorId}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const { data: reviews, isLoading: reviewsLoading } = useSWR<any[]>(
    `/api/tutors/${tutorId}/reviews`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const handleBookClass = (classId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      alert('Only students can book classes');
      return;
    }
    router.push(`/classes/${classId}/book`);
  };

  if (tutorLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </main>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Tutor not found</p>
            <Link href="/tutors" className="text-blue-600 hover:underline">
              Back to Tutors
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutor Profile</h1>
                <p className="text-gray-600">{tutor.city || 'Location not specified'}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-yellow-600 mb-1">{tutor.averageRating.toFixed(1)}★</div>
                <p className="text-gray-600">{tutor.totalReviews} reviews</p>
              </div>
            </div>

            {/* Trust & Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Trust Score</p>
                <p className="text-2xl font-bold text-blue-600">{tutor.trustScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Classes</p>
                <p className="text-2xl font-bold text-green-600">{tutor.totalCompletedBookings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="text-2xl font-bold text-purple-600">{tutor.yearsOfExperience}y</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{tutor.verified ? '✓' : '✗'}</p>
              </div>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About</h2>
                <p className="text-gray-700 leading-relaxed">{tutor.bio}</p>
              </div>
            )}

            {/* Education */}
            {tutor.education && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Education</h2>
                <p className="text-gray-700">{tutor.education}</p>
              </div>
            )}

            {/* Teaching Modes & Price */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Teaching Modes</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.teachingModes.map((mode) => (
                    <span
                      key={mode}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {mode === 'ONLINE' ? 'Online' : mode === 'AT_STUDENT' ? 'At Student' : 'At Tutor'}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Hourly Rate</h3>
                {tutor.hourlyRateMin && tutor.hourlyRateMax && (
                  <p className="text-2xl font-bold text-blue-600">
                    ${tutor.hourlyRateMin} - ${tutor.hourlyRateMax}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Classes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Classes</h2>
            {classesLoading ? (
              <p className="text-gray-500">Loading classes...</p>
            ) : classes && classes.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div key={cls.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">Price: ${cls.pricePerHour}/hour</p>
                      <p className="text-sm text-gray-600">Status: {cls.status}</p>
                    </div>
                    <button
                      onClick={() => handleBookClass(cls.id)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      Book Class
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 bg-white p-6 rounded-lg">No classes available</p>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Reviews</h2>
            {reviewsLoading ? (
              <p className="text-gray-500">Loading reviews...</p>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900">Student {review.studentId.slice(0, 8)}</p>
                      <p className="text-yellow-600 font-bold">{review.rating}★</p>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 bg-white p-6 rounded-lg">No reviews yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
