'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useSubjects } from '@/hooks/useSubjects';
import { Save, AlertCircle } from 'lucide-react';

export default function StudentProfilePage() {
  const { profile, isLoading, updateProfile } = useStudentProfile();
  const { subjects } = useSubjects();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
      <div className="p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Student Profile
          </h1>
          <p className="text-slate-400">Update your learning preferences and goals</p>
        </div>

        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 px-6 py-4 rounded-lg flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            Profile updated successfully!
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl p-8 max-w-3xl border border-purple-500/20 animate-fade-in">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">Grade Level</label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  placeholder="e.g., Grade 10"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">Learning Goals</label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  placeholder="What are your learning goals?"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">Preferred Subjects</label>
                <div className="grid grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center gap-3 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-purple-500/50 transition cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.preferredSubjects.includes(subject.id)}
                        onChange={() => handleSubjectChange(subject.id)}
                        className="w-4 h-4 rounded bg-slate-600 border-slate-500 accent-purple-500 cursor-pointer"
                      />
                      <span className="text-slate-200 group-hover:text-white transition">{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information for tutors"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
