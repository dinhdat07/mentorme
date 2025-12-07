'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { Review } from '@/lib/types';
import { Star } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';
import { useTutorProfile } from '@/hooks/useTutorProfile';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Đánh giá từ học viên',
    emptyTitle: 'Chưa có đánh giá',
    emptySubtitle: 'Hoàn tất buổi học đầu tiên để nhận đánh giá',
  },
  en: {
    title: 'Student Reviews',
    emptyTitle: 'No reviews yet',
    emptySubtitle: 'Complete your first booking to receive reviews',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    text: 'text-white',
    muted: 'text-white/70',
    card: 'bg-white/10 border border-white/20 backdrop-blur-md',
    header: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    ratingCard: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 text-white',
    starOn: 'fill-yellow-400 text-yellow-400',
    starOff: 'text-white/20',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-600',
    card: 'bg-white border border-slate-200 shadow-sm',
    header: 'text-gradient',
    ratingCard: 'bg-gradient-to-br from-purple-100 to-pink-100 border border-slate-200 text-slate-900',
    starOn: 'fill-yellow-500 text-yellow-500',
    starOff: 'text-slate-300',
  },
};

export default function TutorReviewsPage() {
  const { profile, isLoading: isProfileLoading } = useTutorProfile();
  const { data: reviews, isLoading } = useSWR<Review[]>(
    profile ? `/api/tutors/${profile.id}/reviews` : null,
    apiClient.get,
    { revalidateOnFocus: false }
  );
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <h1 className={`text-4xl font-bold leading-tight mb-6 ${styles.header}`}>{t.title}</h1>

        {isLoading || isProfileLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : !profile ? (
          <div className={`rounded-xl p-12 text-center ${styles.card}`}>
            <p className={`text-lg ${styles.muted}`}>{language === 'vi' ? 'Không tìm thấy hồ sơ' : 'Profile not found'}</p>
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
                    <div className={`rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className={`font-semibold mb-1 ${styles.text}`}>
                          Review #{index + 1}: {(review as any)?.booking?.class?.title || 'Review'}
                        </p>
                        <p className={`text-sm ${styles.muted}`}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                        <div className={`text-center rounded-lg px-4 py-2 ${styles.ratingCard}`}>
                      <div className="flex items-center gap-1 justify-center mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? styles.starOn : styles.starOff}
                          />
                        ))}
                      </div>
                      <p className="text-lg font-bold text-gradient">{review.rating}/5</p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className={`${styles.text} leading-relaxed`}>{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl p-12 text-center ${styles.card}`}>
            <p className={`text-lg mb-4 ${styles.muted}`}>{t.emptyTitle}</p>
            <p className={styles.muted}>{t.emptySubtitle}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
