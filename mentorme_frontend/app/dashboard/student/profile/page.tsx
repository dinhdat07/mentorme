'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useSubjects } from '@/hooks/useSubjects';
import { Save, AlertCircle } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Hồ sơ học viên',
    subtitle: 'Cập nhật thông tin và mục tiêu học tập của bạn',
    grade: 'Khối/lớp',
    gradePlaceholder: 'VD: Lớp 10',
    goals: 'Mục tiêu học tập',
    goalsPlaceholder: 'Bạn muốn đạt điều gì?',
    subjects: 'Môn học ưu tiên',
    notes: 'Ghi chú thêm',
    notesPlaceholder: 'Thông tin thêm cho gia sư',
    saving: 'Đang lưu...',
    save: 'Lưu hồ sơ',
    success: 'Cập nhật hồ sơ thành công!',
  },
  en: {
    title: 'Student Profile',
    subtitle: 'Update your learning preferences and goals',
    grade: 'Grade Level',
    gradePlaceholder: 'e.g., Grade 10',
    goals: 'Learning Goals',
    goalsPlaceholder: 'What are your learning goals?',
    subjects: 'Preferred Subjects',
    notes: 'Additional Notes',
    notesPlaceholder: 'Any additional information for tutors',
    saving: 'Saving...',
    save: 'Save Profile',
    success: 'Profile updated successfully!',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    text: 'text-white',
    muted: 'text-white/70',
    card: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20',
    input: 'bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:ring-purple-500 focus:border-transparent',
    checkLabel: 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/50',
    success: 'from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-300',
    saveButton: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50',
    title: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-600',
    card: 'bg-white border border-slate-200 shadow-sm',
    input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-purple-400 focus:border-purple-200',
    checkLabel: 'bg-slate-50 border border-slate-200 hover:border-purple-400',
    success: 'from-green-100 to-emerald-100 border-green-300 text-green-800',
    saveButton: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm',
    title: 'text-gradient',
  },
};

export default function StudentProfilePage() {
  const { profile, isLoading, updateProfile } = useStudentProfile();
  const { subjects } = useSubjects();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];
  const [formData, setFormData] = useState({
    gradeLevel: profile?.gradeLevel || '',
    goals: profile?.goals || '',
    preferredSubjects: profile?.preferredSubjects || [],
    notes: profile?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.includes(subjectId)
        ? prev.preferredSubjects.filter((s) => s !== subjectId)
        : [...prev.preferredSubjects, subjectId],
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
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8 transition-colors duration-300">
        <div className="mb-10 animate-fade-in">
          <h1 className={`text-4xl font-bold leading-tight mb-2 ${styles.title}`}>
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
          <form onSubmit={handleSubmit} className={`backdrop-blur-xl rounded-xl shadow-2xl p-8 max-w-3xl animate-fade-in ${styles.card}`}>
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.grade}</label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  placeholder={t.gradePlaceholder}
                  className={`w-full px-4 py-3 rounded-lg transition duration-300 ${styles.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.goals}</label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  placeholder={t.goalsPlaceholder}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg transition duration-300 resize-none ${styles.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.subjects}</label>
                <div className="grid grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <label key={subject.id} className={`flex items-center gap-3 p-3 rounded-lg transition cursor-pointer group ${styles.checkLabel}`}>
                      <input
                        type="checkbox"
                        checked={formData.preferredSubjects.includes(subject.id)}
                        onChange={() => handleSubjectChange(subject.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-purple-500 cursor-pointer"
                      />
                      <span className={`${styles.text}`}>{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${styles.text}`}>{t.notes}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t.notesPlaceholder}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg transition duration-300 resize-none ${styles.input}`}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 ${styles.saveButton}`}
              >
                <Save className="w-5 h-5" />
                {isSaving ? t.saving : t.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
