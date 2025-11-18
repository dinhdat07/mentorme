'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTutors } from '@/hooks/useTutors';
import { useSubjects } from '@/hooks/useSubjects';
import { TutorCard } from '@/components/tutor-card';
import { SidebarNav } from '@/components/sidebar-nav';

export default function TutorsPage() {
  const { subjects } = useSubjects();
  const [filters, setFilters] = useState({
    subjectId: '',
    city: '',
    priceMin: 0,
    priceMax: 500,
    trustScoreMin: 0,
    page: 1,
    pageSize: 12,
  });

  const { tutors, isLoading } = useTutors(filters);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Tutors</h1>
          <p className="text-gray-600 mb-8">Browse and filter qualified tutors in your area</p>

          <div className="grid grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>

              <div className="space-y-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Enter city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price: ${filters.priceMax}/hour
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Trust Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Trust Score: {filters.trustScoreMin}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.trustScoreMin}
                    onChange={(e) => handleFilterChange('trustScoreMin', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={() => setFilters({
                    subjectId: '',
                    city: '',
                    priceMin: 0,
                    priceMax: 500,
                    trustScoreMin: 0,
                    page: 1,
                    pageSize: 12,
                  })}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Tutors Grid */}
            <div className="col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
              ) : tutors.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {tutors.map((tutor) => (
                      <TutorCard key={tutor.id} tutor={tutor} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-800 rounded-lg font-medium transition"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700 font-medium">Page {filters.page}</span>
                    <button
                      disabled={tutors.length < filters.pageSize}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-800 rounded-lg font-medium transition"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-600 text-lg mb-4">No tutors found matching your criteria</p>
                  <button
                    onClick={() => setFilters({
                      subjectId: '',
                      city: '',
                      priceMin: 0,
                      priceMax: 500,
                      trustScoreMin: 0,
                      page: 1,
                      pageSize: 12,
                    })}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
