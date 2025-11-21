'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { Review } from '@/lib/types';
import { Star } from 'lucide-react';

export default function TutorReviewsPage() {
  const { data: reviews, isLoading } = useSWR<Review[]>(
    '/api/tutors/me/reviews',
    apiClient.get,
    { revalidateOnFocus: false }
  );

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">Student Reviews</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className="animate-fadeIn"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="glass rounded-xl p-6 border border-white/20 backdrop-blur-md hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-white mb-1">Review {review.id.slice(0, 8)}</p>
                      <p className="text-sm text-white/60">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg px-4 py-2 border border-white/10">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}
                          />
                        ))}
                      </div>
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{review.rating}/5</p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-white/80 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center border border-white/20 backdrop-blur-md">
            <p className="text-white/70 text-lg mb-4">No reviews yet</p>
            <p className="text-white/50">Complete your first booking to receive reviews</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
