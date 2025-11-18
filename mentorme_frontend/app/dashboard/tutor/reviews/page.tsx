'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { Review } from '@/lib/types';

export default function TutorReviewsPage() {
  const { data: reviews, isLoading } = useSWR<Review[]>(
    '/api/tutors/me/reviews',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Reviews</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">Review {review.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">{review.rating}</p>
                    <p className="text-xs text-gray-500">out of 5</p>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No reviews yet</p>
            <p className="text-gray-500">Complete your first booking to receive reviews</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
