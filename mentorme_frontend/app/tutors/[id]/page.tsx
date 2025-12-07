'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { TutorProfile, Class, Review } from '@/lib/types';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuthContext } from '@/components/auth-provider';
import { useUISettings } from '@/components/ui-settings-context';
import { Star, BookOpen, Award, Users, Zap, MapPin, ArrowLeft } from 'lucide-react';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    pageTitle: 'Hồ sơ gia sư',
    back: 'Quay lại',
    about: 'Giới thiệu',
    education: 'Học vấn',
    teachingModes: 'Hình thức dạy',
    hourlyRate: 'Học phí (VNĐ/giờ)',
    rating: 'Đánh giá',
    trust: 'Tin cậy',
    completed: 'Lịch hoàn tất',
    experience: 'Kinh nghiệm',
    verified: 'Xác thực',
    location: 'Khu vực',
    availableClasses: 'Lớp đang mở',
    noClasses: 'Chưa có lớp nào',
    loadingClasses: 'Đang tải lớp...',
    book: 'Đặt lớp',
    reviews: 'Đánh giá từ học viên',
    noReviews: 'Chưa có đánh giá',
    loadingReviews: 'Đang tải đánh giá...',
    notFound: 'Không tìm thấy gia sư',
    bookOnlyStudent: 'Chỉ học viên mới được đặt lớp',
  },
  en: {
    pageTitle: 'Tutor Profile',
    back: 'Back',
    about: 'About',
    education: 'Education',
    teachingModes: 'Teaching Modes',
    hourlyRate: 'Rate (VND/hour)',
    rating: 'Rating',
    trust: 'Trust',
    completed: 'Completed Classes',
    experience: 'Experience',
    verified: 'Verified',
    location: 'Location',
    availableClasses: 'Available Classes',
    noClasses: 'No classes available',
    loadingClasses: 'Loading classes...',
    book: 'Book Class',
    reviews: 'Student Reviews',
    noReviews: 'No reviews yet',
    loadingReviews: 'Loading reviews...',
    notFound: 'Tutor not found',
    bookOnlyStudent: 'Only students can book classes',
  },
};

const modeLabels: Record<string, { vi: string; en: string }> = {
  ONLINE: { vi: 'Online', en: 'Online' },
  AT_STUDENT: { vi: 'Tại nhà học viên', en: 'At Student' },
  AT_TUTOR: { vi: 'Tại nhà gia sư', en: 'At Tutor' },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    page: 'bg-slate-950 text-white',
    card: 'bg-slate-900/70 border border-slate-800',
    muted: 'text-white/70',
    stat: 'bg-white/5',
    badge: 'bg-purple-500/10 text-purple-200 border border-purple-400/40',
    heading: 'text-white',
  },
  light: {
    page: 'bg-slate-50 text-slate-900',
    card: 'bg-white border border-slate-200',
    muted: 'text-slate-600',
    stat: 'bg-slate-50',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    heading: 'text-slate-900',
  },
};

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const { theme, language } = useUISettings();
  const styles = themeStyles[theme];
  const t = translations[language];
  const tutorId = params.id as string;

  const { data: tutor, isLoading: tutorLoading } = useSWR<TutorProfile>(
    `/api/tutors/${tutorId}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const { data: classesRes, isLoading: classesLoading } = useSWR<any>(
    `/api/classes?tutorId=${tutorId}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const { data: reviews, isLoading: reviewsLoading } = useSWR<Review[]>(
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
      alert(t.bookOnlyStudent);
      return;
    }
    router.push(`/classes/${classId}/book`);
  };

  if (tutorLoading) {
    return (
      <div className={`flex h-screen ${styles.page}`}>
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </main>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className={`flex h-screen ${styles.page}`}>
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">{t.notFound}</p>
            <Link href="/tutors" className="text-purple-500 hover:underline">
              {t.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${styles.page}`}>
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>
          <h1 className="text-4xl font-bold">{tutor.user?.fullName || t.pageTitle}</h1>
          <p className="text-white/80 mt-2">{t.pageTitle}</p>
        </div>

        <div className="p-8 space-y-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            <div className={`col-span-2 rounded-xl p-6 ${styles.card}`}>
              <h2 className={`text-2xl font-bold mb-4 ${styles.heading}`}>{t.pageTitle}</h2>

              <div className="space-y-4">
                {tutor.bio && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${styles.heading}`}>{t.about}</h3>
                    <p className="text-base leading-relaxed">{tutor.bio}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4" /> {t.location}:{' '}
                  <span className={styles.muted}>
                    {tutor.city || '-'} {tutor.district ? `, ${tutor.district}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Award className="w-4 h-4" /> {t.education}:{' '}
                  <span className={styles.muted}>{tutor.education || (language === 'vi' ? 'Chưa cập nhật' : 'N/A')}</span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 ${styles.card}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${styles.stat}`}>
                  <p className="text-2xl font-bold text-yellow-500">{tutor.averageRating.toFixed(1)}</p>
                  <p className={`text-xs ${styles.muted}`}>{t.rating}</p>
                </div>
                <div className={`p-3 rounded-lg ${styles.stat}`}>
                  <p className="text-2xl font-bold text-blue-500">{tutor.trustScore.toFixed(1)}</p>
                  <p className={`text-xs ${styles.muted}`}>{t.trust}</p>
                </div>
                <div className={`p-3 rounded-lg ${styles.stat}`}>
                  <p className="text-2xl font-bold text-green-500">{tutor.totalCompletedBookings}</p>
                  <p className={`text-xs ${styles.muted}`}>{t.completed}</p>
                </div>
                <div className={`p-3 rounded-lg ${styles.stat}`}>
                  <p className="text-2xl font-bold text-purple-500">{tutor.yearsOfExperience}y</p>
                  <p className={`text-xs ${styles.muted}`}>{t.experience}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold">{t.hourlyRate}</p>
                {tutor.hourlyRateMin && tutor.hourlyRateMax && (
                  <p className="text-xl font-bold text-purple-500">
                    {tutor.hourlyRateMin.toLocaleString('vi-VN')} - {tutor.hourlyRateMax.toLocaleString('vi-VN')} ₫/giờ
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Classes */}
          <div className={`rounded-xl p-6 ${styles.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${styles.heading}`}>{t.availableClasses}</h3>
            {classesLoading ? (
              <p className={styles.muted}>{t.loadingClasses}</p>
            ) : (classesRes?.data || classesRes)?.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {(classesRes?.data || classesRes || []).map((cls: Class, idx: number) => (
                  <div
                    key={cls.id}
                    className={`p-6 rounded-xl border transition duration-300 ${
                      theme === 'dark'
                        ? 'border-slate-800 bg-slate-900/70 hover:border-purple-400/50'
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <h3 className="text-lg font-bold mb-2">{cls.title}</h3>
                    <p className={`text-sm ${styles.muted} mb-3 line-clamp-2`}>{cls.description}</p>
                    <p className="text-sm text-purple-500 font-semibold mb-2">
                      {cls.pricePerHour.toLocaleString('vi-VN')} ₫/giờ
                    </p>
                    <p className={`text-xs ${styles.muted} mb-4`}>
                      {t.location}: {cls.locationType}
                    </p>
                    <button
                      onClick={() => handleBookClass(cls.id)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition duration-300 shadow-lg shadow-purple-500/30"
                    >
                      {t.book}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>{t.noClasses}</p>
            )}
          </div>

          {/* Reviews */}
          <div className={`rounded-xl p-6 ${styles.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${styles.heading}`}>{t.reviews}</h3>
            {reviewsLoading ? (
              <p className={styles.muted}>{t.loadingReviews}</p>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review, idx) => (
                  <div
                    key={review.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <p className="font-semibold">
                      {language === 'vi' ? 'Học viên' : 'Student'} {review.studentId.slice(0, 8)}
                    </p>
                    <p className={`text-sm ${styles.muted}`}>
                      {new Date(review.createdAt).toLocaleDateString()} • {review.rating}★
                    </p>
                    {review.comment && <p className={`text-sm ${styles.muted} mt-1`}>{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>{t.noReviews}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
