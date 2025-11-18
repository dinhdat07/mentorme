'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';

export default function TutorClassesPage() {
  const { classes, isLoading, mutate } = useTutorClasses();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdateStatus = async (classId: string, newStatus: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') => {
    try {
      setProcessingId(classId);
      await apiClient.patch(`/api/classes/${classId}/status`, {
        status: newStatus,
      });
      mutate();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const groupedClasses = {
    DRAFT: classes.filter((c) => c.status === 'DRAFT'),
    PUBLISHED: classes.filter((c) => c.status === 'PUBLISHED'),
    ARCHIVED: classes.filter((c) => c.status === 'ARCHIVED'),
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <Link
            href="/dashboard/tutor/classes/new"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Create New Class
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Published Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Published ({groupedClasses.PUBLISHED.length})</h2>
              {groupedClasses.PUBLISHED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.PUBLISHED.map((cls) => (
                    <div key={cls.id} className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{cls.description}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>${cls.pricePerHour}/hour</span>
                            <span>{cls.locationType}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/tutor/classes/${cls.id}`}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleUpdateStatus(cls.id, 'ARCHIVED')}
                            disabled={processingId === cls.id}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {processingId === cls.id ? '...' : 'Archive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No published classes</p>
              )}
            </div>

            {/* Draft Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Draft ({groupedClasses.DRAFT.length})</h2>
              {groupedClasses.DRAFT.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.DRAFT.map((cls) => (
                    <div key={cls.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{cls.description}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>${cls.pricePerHour}/hour</span>
                            <span>{cls.locationType}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/tutor/classes/${cls.id}`}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleUpdateStatus(cls.id, 'PUBLISHED')}
                            disabled={processingId === cls.id}
                            className="px-4 py-2 bg-green-100 text-green-600 rounded-lg font-medium hover:bg-green-200 transition disabled:opacity-50"
                          >
                            {processingId === cls.id ? '...' : 'Publish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No draft classes</p>
              )}
            </div>

            {/* Archived Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Archived ({groupedClasses.ARCHIVED.length})</h2>
              {groupedClasses.ARCHIVED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.ARCHIVED.map((cls) => (
                    <div key={cls.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{cls.description}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>${cls.pricePerHour}/hour</span>
                            <span>{cls.locationType}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/tutor/classes/${cls.id}`}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No archived classes</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
