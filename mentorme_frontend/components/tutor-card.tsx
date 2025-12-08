'use client';

import Link from 'next/link';
import { TutorProfile } from '@/lib/types';
import { useUISettings } from './ui-settings-context';

interface TutorCardProps {
  tutor: TutorProfile;
}

const modeLabels: Record<string, { vi: string; en: string }> = {
  ONLINE: { vi: 'Online', en: 'Online' },
  AT_STUDENT: { vi: 'Tại nhà học viên', en: 'At Student' },
  AT_TUTOR: { vi: 'Tại nhà gia sư', en: 'At Tutor' },
};

export const TutorCard = ({ tutor }: TutorCardProps) => {
  const { theme, language } = useUISettings();
  const isDark = theme === 'dark';

  const styles = {
    card: isDark ? 'bg-slate-900/60 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-900',
    shadow: isDark ? 'shadow-lg shadow-slate-900/40 hover:shadow-xl hover:shadow-slate-900/50' : 'shadow-sm hover:shadow-lg',
    muted: isDark ? 'text-white/70' : 'text-slate-600',
    accentText: 'text-purple-500',
    chip: isDark ? 'bg-purple-500/10 text-purple-200 border border-purple-500/40' : 'bg-purple-50 text-purple-700 border border-purple-200',
    statBg: isDark ? 'bg-white/5' : 'bg-slate-50',
    footer: isDark ? 'border-t border-slate-800 bg-slate-900/70' : 'border-t border-slate-200 bg-slate-50',
    btn: isDark ? 'text-purple-200' : 'text-purple-700',
  };

  const displayName = tutor.user?.fullName || tutor.bio || (language === 'vi' ? 'Gia sư' : 'Tutor');

  return (
    <Link href={`/tutors/${tutor.id}`}>
      <div className={`rounded-lg transition h-full ${styles.card} ${styles.shadow}`}>
        <div className="p-6 space-y-4">
          {/* Tutor Info */}
          <h3 className="text-lg font-bold line-clamp-1">{displayName}</h3>
          {tutor.bio && <p className={`text-sm line-clamp-2 ${styles.muted}`}>{tutor.bio}</p>}

          {/* Education */}
          {tutor.education && (
            <div className="space-y-1">
              <p className={`text-xs font-medium ${styles.muted}`}>{language === 'vi' ? 'Học vấn' : 'Education'}</p>
              <p className="text-sm line-clamp-2">{tutor.education}</p>
            </div>
          )}

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-2 p-3 rounded-lg ${styles.statBg}`}>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{tutor.averageRating.toFixed(1)}</p>
              <p className={`text-xs ${styles.muted}`}>{language === 'vi' ? 'Đánh giá' : 'Rating'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{tutor.trustScore.toFixed(1)}</p>
              <p className={`text-xs ${styles.muted}`}>{language === 'vi' ? 'Tin cậy' : 'Trust'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{tutor.totalCompletedBookings}</p>
              <p className={`text-xs ${styles.muted}`}>{language === 'vi' ? 'Lịch hoàn tất' : 'Classes'}</p>
            </div>
          </div>

          {/* Experience & Price */}
          <div className={`space-y-2 text-sm ${styles.muted}`}>
            <p>
              {language === 'vi' ? 'Kinh nghiệm' : 'Experience'}: {tutor.yearsOfExperience}{' '}
              {language === 'vi' ? 'năm' : 'years'}
            </p>
            {tutor.hourlyRateMin && tutor.hourlyRateMax && (
              <p className="font-semibold text-purple-500">
                {tutor.hourlyRateMin.toLocaleString('vi-VN')} - {tutor.hourlyRateMax.toLocaleString('vi-VN')} ₫/giờ
              </p>
            )}
            {tutor.city && (
              <p>
                {language === 'vi' ? 'Khu vực' : 'Location'}: {tutor.city}
                {tutor.district ? `, ${tutor.district}` : ''}
              </p>
            )}
          </div>

          {/* Teaching Modes */}
          {tutor.teachingModes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tutor.teachingModes.map((mode) => (
                <span key={mode} className={`px-2 py-1 text-xs rounded-full border ${styles.chip}`}>
                  {modeLabels[mode]?.[language] ?? mode}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Profile Button */}
        <div className={`px-6 py-3 ${styles.footer}`}>
          <p className={`text-center font-medium text-sm ${styles.btn}`}>{language === 'vi' ? 'Xem hồ sơ →' : 'View Profile →'}</p>
        </div>
      </div>
    </Link>
  );
};
