'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { useSubjects } from '@/hooks/useSubjects';
import { Save, AlertCircle, TrendingUp, Award, Users } from 'lucide-react';

export default function TutorProfilePage() {
  const { profile, isLoading, updateProfile } = useTutorProfile();
  const { subjects } = useSubjects();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
      <div className="p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Tutor Profile
          </h1>
          <p className="text-slate-400">Showcase your expertise and experience</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trust & Reputation Section */}
            {profile && (
              <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Trust Score</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {profile.trustScore.toFixed(1)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Average Rating</p>
                      <p className="text-3xl font-bold text-yellow-400">{profile.averageRating.toFixed(1)}★</p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-400 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Completed Bookings</p>
                      <p className="text-3xl font-bold text-green-400">{profile.totalCompletedBookings}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-400 opacity-50" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-purple-500/20 animate-fade-in">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell students about yourself"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Education</label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Your education and qualifications"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Your city"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Hourly Rate (Min)</label>
                    <input
                      type="number"
                      name="hourlyRateMin"
                      value={formData.hourlyRateMin}
                      onChange={handleChange}
                      placeholder="Minimum rate"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Hourly Rate (Max)</label>
                    <input
                      type="number"
                      name="hourlyRateMax"
                      value={formData.hourlyRateMax}
                      onChange={handleChange}
                      placeholder="Maximum rate"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Teaching Modes</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['ONLINE', 'AT_STUDENT', 'AT_TUTOR'].map((mode) => (
                      <label key={mode} className="flex items-center gap-3 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-purple-500/50 transition cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.teachingModes.includes(mode)}
                          onChange={() => handleTeachingModeToggle(mode)}
                          className="w-4 h-4 rounded bg-slate-600 border-slate-500 accent-purple-500 cursor-pointer"
                        />
                        <span className="text-slate-200 group-hover:text-white transition">
                          {mode === 'ONLINE' ? 'Online' : mode === 'AT_STUDENT' ? 'At Student' : 'At Tutor'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Your district"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 transition duration-300"
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
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
