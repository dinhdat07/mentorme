'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useTutorProfile } from '@/hooks/useTutorProfile';
import { useSubjects } from '@/hooks/useSubjects';

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tutor Profile</h1>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Profile updated successfully!
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-3xl">
            <div className="space-y-6">
              {/* Trust & Reputation Section */}
              {profile && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Trust Score</p>
                    <p className="text-2xl font-bold text-blue-600">{profile.trustScore.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{profile.averageRating.toFixed(1)}★</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed Bookings</p>
                    <p className="text-2xl font-bold text-green-600">{profile.totalCompletedBookings}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell students about yourself"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="Your education and qualifications"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (Min)</label>
                  <input
                    type="number"
                    name="hourlyRateMin"
                    value={formData.hourlyRateMin}
                    onChange={handleChange}
                    placeholder="Minimum rate"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (Max)</label>
                  <input
                    type="number"
                    name="hourlyRateMax"
                    value={formData.hourlyRateMax}
                    onChange={handleChange}
                    placeholder="Maximum rate"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Modes</label>
                <div className="grid grid-cols-3 gap-3">
                  {['ONLINE', 'AT_STUDENT', 'AT_TUTOR'].map((mode) => (
                    <label key={mode} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.teachingModes.includes(mode)}
                        onChange={() => handleTeachingModeToggle(mode)}
                        className="rounded"
                      />
                      <span className="ml-2 text-gray-700">
                        {mode === 'ONLINE' ? 'Online' : mode === 'AT_STUDENT' ? 'At Student' : 'At Tutor'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Your district"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
