'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useSubjects } from '@/hooks/useSubjects';
import { apiClient } from '@/lib/api-client';
import useSWR from 'swr';
import { Class } from '@/lib/types';

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { subjects } = useSubjects();

  const { data: classData, isLoading: classLoading } = useSWR<Class>(
    `/api/classes/${classId}`,
    apiClient.get
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetGrade: '',
    pricePerHour: 20,
    locationType: 'ONLINE' as 'ONLINE' | 'AT_STUDENT' | 'AT_TUTOR',
    city: '',
    district: '',
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        title: classData.title || '',
        description: classData.description || '',
        targetGrade: classData.targetGrade || '',
        pricePerHour: classData.pricePerHour || 20,
        locationType: classData.locationType || 'ONLINE',
        city: classData.city || '',
        district: classData.district || '',
      });
    }
  }, [classData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pricePerHour' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await apiClient.patch(`/api/classes/${classId}`, formData);
      router.push('/dashboard/tutor/classes');
    } catch (err: any) {
      setError(err.message || 'Failed to update class');
    } finally {
      setIsSaving(false);
    }
  };

  if (classLoading) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8">
          <p className="text-gray-600">Class not found</p>
          <Link href="/dashboard/tutor/classes" className="text-blue-600 hover:underline">
            Back to Classes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Class</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Grade</label>
                <input
                  type="text"
                  name="targetGrade"
                  value={formData.targetGrade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Hour *</label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Location *</label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ONLINE">Online</option>
                <option value="AT_STUDENT">At Student Location</option>
                <option value="AT_TUTOR">At My Location</option>
              </select>
            </div>

            {formData.locationType !== 'ONLINE' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isSaving ? 'Saving...' : 'Save Class'}
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
