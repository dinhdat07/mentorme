'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { Plus, Edit, Archive, CheckCircle } from 'lucide-react';

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">My Classes</h1>
          <Link
            href="/dashboard/tutor/classes/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          >
            <Plus size={20} />
            Create New Class
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Published Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '0ms' }}>
              <h2 className="text-2xl font-bold text-white mb-4">
                Published <span className="text-green-400">({groupedClasses.PUBLISHED.length})</span>
              </h2>
              {groupedClasses.PUBLISHED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.PUBLISHED.map((cls, idx) => (
                    <div
                      key={cls.id}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="glass rounded-xl p-6 border border-green-400/20 hover:border-green-400/50 backdrop-blur-md hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white">{cls.title}</h3>
                              <CheckCircle size={20} className="text-green-400" />
                            </div>
                            <p className="text-sm text-white/60 mb-3 line-clamp-1">{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className="text-white/70">
                                <span className="text-purple-300">Price:</span> ${cls.pricePerHour}/hour
                              </span>
                              <span className="text-white/70">
                                <span className="text-purple-300">Type:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-medium transition-all duration-300 border border-purple-500/20"
                            >
                              <Edit size={16} />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleUpdateStatus(cls.id, 'ARCHIVED')}
                              disabled={processingId === cls.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition-all duration-300 border border-red-500/20 disabled:opacity-50"
                            >
                              <Archive size={16} />
                              {processingId === cls.id ? '...' : 'Archive'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-xl p-6 text-center border border-white/10 backdrop-blur-md">
                  <p className="text-white/50">No published classes</p>
                </div>
              )}
            </div>

            {/* Draft Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <h2 className="text-2xl font-bold text-white mb-4">
                Draft <span className="text-yellow-400">({groupedClasses.DRAFT.length})</span>
              </h2>
              {groupedClasses.DRAFT.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.DRAFT.map((cls, idx) => (
                    <div
                      key={cls.id}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="glass rounded-xl p-6 border border-yellow-400/20 hover:border-yellow-400/50 backdrop-blur-md hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{cls.title}</h3>
                            <p className="text-sm text-white/60 mb-3 line-clamp-1">{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className="text-white/70">
                                <span className="text-purple-300">Price:</span> ${cls.pricePerHour}/hour
                              </span>
                              <span className="text-white/70">
                                <span className="text-purple-300">Type:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-medium transition-all duration-300 border border-purple-500/20"
                            >
                              <Edit size={16} />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleUpdateStatus(cls.id, 'PUBLISHED')}
                              disabled={processingId === cls.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-medium transition-all duration-300 border border-green-500/20 disabled:opacity-50"
                            >
                              <CheckCircle size={16} />
                              {processingId === cls.id ? '...' : 'Publish'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-xl p-6 text-center border border-white/10 backdrop-blur-md">
                  <p className="text-white/50">No draft classes</p>
                </div>
              )}
            </div>

            {/* Archived Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <h2 className="text-2xl font-bold text-white mb-4">
                Archived <span className="text-gray-400">({groupedClasses.ARCHIVED.length})</span>
              </h2>
              {groupedClasses.ARCHIVED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.ARCHIVED.map((cls, idx) => (
                    <div
                      key={cls.id}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="glass rounded-xl p-6 border border-white/10 hover:border-white/20 backdrop-blur-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white/70 mb-2">{cls.title}</h3>
                            <p className="text-sm text-white/50 mb-3 line-clamp-1">{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className="text-white/60">
                                <span className="text-white/50">Price:</span> ${cls.pricePerHour}/hour
                              </span>
                              <span className="text-white/60">
                                <span className="text-white/50">Type:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/tutor/classes/${cls.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg font-medium transition-all duration-300 border border-white/10"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-xl p-6 text-center border border-white/10 backdrop-blur-md">
                  <p className="text-white/50">No archived classes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
