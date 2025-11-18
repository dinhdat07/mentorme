'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuthContext } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';
import useSWR from 'swr';
import { Class } from '@/lib/types';

export default function BookClassPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const classId = params.id as string;

  const { data: classData, isLoading: classLoading } = useSWR<Class>(
    `/api/classes/${classId}`,
    apiClient.get
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    isTrial: false,
    requestedHoursPerWeek: 2,
    startDateExpected: new Date().toISOString().split('T')[0],
    noteFromStudent: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'requestedHoursPerWeek' ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/api/bookings', {
        classId,
        ...formData,
      });
      router.push('/dashboard/student/bookings');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Link href="/tutors" className="text-blue-600 hover:underline mb-8 inline-block">
            ← Back to Tutors
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Class</h1>

          {classLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : classData ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Class Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">{classData.title}</h2>
                  <p className="text-gray-600 mb-2">{classData.description}</p>
                  <p className="font-semibold text-blue-600">${classData.pricePerHour}/hour</p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isTrial"
                      checked={formData.isTrial}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="ml-2 text-gray-700 font-medium">This is a trial class</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Per Week *
                  </label>
                  <select
                    name="requestedHoursPerWeek"
                    value={formData.requestedHoursPerWeek}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours > 1 ? 's' : ''} per week
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDateExpected"
                    value={formData.startDateExpected}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message to Tutor
                  </label>
                  <textarea
                    name="noteFromStudent"
                    value={formData.noteFromStudent}
                    onChange={handleChange}
                    placeholder="Tell the tutor about your needs, goals, etc."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {isLoading ? 'Booking...' : 'Request Booking'}
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
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">Class not found</p>
              <Link href="/tutors" className="text-blue-600 hover:underline">
                Back to Tutors
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
