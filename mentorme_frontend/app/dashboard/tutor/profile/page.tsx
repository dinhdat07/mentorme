'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { Save, AlertCircle, TrendingUp, Award, Users } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Hồ sơ gia sư',
    subtitle: 'Giới thiệu chuyên môn và kinh nghiệm của bạn',
    bio: 'Giới thiệu',
    bioPlaceholder: 'Chia sẻ về bản thân với học viên',
    education: 'Học vấn',
    educationPlaceholder: 'Bằng cấp và chứng chỉ',
    years: 'Số năm kinh nghiệm',
    city: 'Thành phố',
    district: 'Quận/Huyện',
    hourlyMin: 'Giá tối thiểu (giờ)',
    hourlyMax: 'Giá tối đa (giờ)',
    teachingModes: 'Hình thức dạy',
    online: 'Trực tuyến',
    atStudent: 'Tại địa điểm học viên',
    atTutor: 'Tại địa điểm gia sư',
    saving: 'Đang lưu...',
    save: 'Lưu hồ sơ',
    success: 'Cập nhật hồ sơ thành công!',
    trust: 'Điểm tin cậy',
    rating: 'Đánh giá trung bình',
    completed: 'Lịch đã hoàn tất',
  },
  en: {
    title: 'Tutor Profile',
    subtitle: 'Showcase your expertise and experience',
    bio: 'Bio',
    bioPlaceholder: 'Tell students about yourself',
    education: 'Education',
    educationPlaceholder: 'Your education and qualifications',
    years: 'Years of Experience',
    city: 'City',
    district: 'District',
    hourlyMin: 'Hourly Rate (Min)',
    hourlyMax: 'Hourly Rate (Max)',
    teachingModes: 'Teaching Modes',
    online: 'Online',
    atStudent: 'At Student',
    atTutor: 'At Tutor',
    saving: 'Saving...',
    save: 'Save Profile',
    success: 'Profile updated successfully!',
    trust: 'Trust Score',
    rating: 'Average Rating',
    completed: 'Completed Bookings',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    text: 'text-white',
    muted: 'text-white/70',
    card: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20',
    input: 'bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-transparent',
    success: 'from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-300',
    title: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent',
    statsCard: 'backdrop-blur-xl rounded-xl p-6 shadow-lg',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-600',
    card: 'bg-white border border-slate-200 shadow-sm',
    input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-purple-400 focus:border-purple-200',
    success: 'from-green-100 to-emerald-100 border-green-300 text-green-800',
    title: 'text-gradient',
    statsCard: 'rounded-xl p-6 shadow-sm border',
  },
};

export default function TutorProfilePage() {
  const { profile, isLoading, updateProfile } = useTutorProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  const [formData, setFormData] = useState({
    bio: '',
    education: '',
    yearsOfExperience: 0,
    hourlyRateMin: 0,
    hourlyRateMax: 0,
    city: '',
    district: '',
    teachingModes: [] as string[],
    certificates: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        education: profile.education || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        hourlyRateMin: profile.hourlyRateMin || 0,
        hourlyRateMax: profile.hourlyRateMax || 0,
        city: profile.city || '',
        district: profile.district || '',
        teachingModes: profile.teachingModes || [],
        certificates: profile.certificates || [],
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Rate') || name === 'yearsOfExperience' ? Number(value) : value,
    }));
  };

  const handleTeachingModeToggle = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      teachingModes: prev.teachingModes.includes(mode)
        ? prev.teachingModes.filter((m) => m !== mode)
        : [...prev.teachingModes, mode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <div className="mb-10 animate-fade-in">
          <h1 className={`text-4xl font-bold leading-tight mb-3 ${styles.title}`}>
            {t.title}
          </h1>
          <p className={styles.muted}>{t.subtitle}</p>
        </div>

        {success && (
          <div className={`mb-6 bg-gradient-to-r px-6 py-4 rounded-lg flex items-center gap-2 animate-fade-in ${styles.success}`}>
            <AlertCircle className="w-5 h-5" />
            {t.success}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trust & Reputation Section */}
            {profile && (
              <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className={`${styles.statsCard} ${theme === 'dark' ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${styles.muted}`}>{t.trust}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {profile.trustScore.toFixed(1)}
                      </p>
                    </div>
                    <TrendingUp className={`w-8 h-8 ${theme === 'dark' ? 'text-purple-400/70' : 'text-purple-500/70'}`} />
                  </div>
                </div>
                <div className={`${styles.statsCard} ${theme === 'dark' ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${styles.muted}`}>{t.rating}</p>
                      <p className="text-3xl font-bold text-yellow-500">{profile.averageRating.toFixed(1)}★</p>
                    </div>
                    <Award className={`w-8 h-8 ${theme === 'dark' ? 'text-yellow-400/70' : 'text-yellow-500/70'}`} />
                  </div>
                </div>
                <div className={`${styles.statsCard} ${theme === 'dark' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${styles.muted}`}>{t.completed}</p>
                      <p className="text-3xl font-bold text-green-500">{profile.totalCompletedBookings}</p>
                    </div>
                    <Users className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400/70' : 'text-green-500/70'}`} />
                  </div>
                </div>
              </div>
            )}

            <div className={`backdrop-blur-xl rounded-xl shadow-2xl p-8 animate-fade-in ${styles.card}`}>
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.bio}</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder={t.bioPlaceholder}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg transition duration-300 resize-none ${styles.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.education}</label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder={t.educationPlaceholder}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg transition duration-300 resize-none ${styles.input}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.years}</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.city}</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.hourlyMin}</label>
                    <input
                      type="number"
                      name="hourlyRateMin"
                      value={formData.hourlyRateMin}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.hourlyMax}</label>
                    <input
                      type="number"
                      name="hourlyRateMax"
                      value={formData.hourlyRateMax}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.teachingModes}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['ONLINE', 'AT_STUDENT', 'AT_TUTOR'].map((mode) => (
                      <label
                        key={mode}
                        className={`flex items-center gap-3 p-3 rounded-lg transition cursor-pointer group ${theme === 'dark' ? 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/50' : 'bg-slate-50 border border-slate-200 hover:border-purple-400'}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.teachingModes.includes(mode)}
                          onChange={() => handleTeachingModeToggle(mode)}
                          className="w-4 h-4 rounded border-slate-300 accent-purple-500 cursor-pointer"
                        />
                        <span className={styles.text}>
                          {mode === 'ONLINE' ? t.online : mode === 'AT_STUDENT' ? t.atStudent : t.atTutor}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.district}</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30`}
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? t.saving : t.save}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
