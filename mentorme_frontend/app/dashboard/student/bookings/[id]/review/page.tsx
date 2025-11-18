'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import useSWR from 'swr';
import { Booking } from '@/lib/types';

export default function CreateReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading: bookingLoading } = useSWR<Booking>(
    `/api/bookings/${bookingId}`,
    apiClient.get
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/api/reviews', {
        bookingId,
        rating,
        comment,
      });
      router.push('/dashboard/student/bookings');
    } catch (err: any) {
      setError(err.message || 'Failed to create review');
    } finally {
      setIsLoading(false);
    }
  };

  if (bookingLoading) {
    return (
      <DashboardLayout requiredRole={['STUDENT']}>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking || booking.status !== 'COMPLETED') {
    return (
      <DashboardLayout requiredRole={['STUDENT']}>
        <div className="p-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Cannot create review for this booking</p>
            <p className="text-gray-500 mb-6">Only completed bookings can be reviewed</p>
            <Link href="/dashboard/student/bookings" className="text-blue-600 hover:underline">
              Back to Bookings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Write a Review</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Booking Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Booking Details</p>
              <p className="text-lg font-bold text-gray-900">Booking {booking.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600">Completed on {new Date(booking.updatedAt).toLocaleDateString()}</p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`px-4 py-2 rounded-lg font-bold text-lg transition ${
                      rating === r
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this tutor"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
