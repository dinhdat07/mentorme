"use client";

import { useState } from "react";
import Link from "next/link";
import { useTutors } from "@/hooks/useTutors";
import { useSubjects } from "@/hooks/useSubjects";
import { TutorCard } from "@/components/tutor-card";
import { SidebarNav } from "@/components/sidebar-nav";
import { Search, Filter, RotateCcw } from "lucide-react";

export default function TutorsPage() {
  const { subjects } = useSubjects();

  // filters thực tế dùng cho hook
  const [filters, setFilters] = useState({
    subjectId: "",
    city: "",
    priceMin: 0,
    priceMax: 500,
    trustScoreMin: 0,
    page: 1,
    pageSize: 12,
  });

  // state tạm để chỉnh sửa form
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const { tutors, isLoading, mutate } = useTutors(filters);

  const handleTempChange = (key: string, value: any) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setTempFilters({
      subjectId: "",
      city: "",
      priceMin: 0,
      priceMax: 500,
      trustScoreMin: 0,
      page: 1,
      pageSize: 12,
    });
    // nếu muốn reset luôn API
    setFilters({
      subjectId: "",
      city: "",
      priceMin: 0,
      priceMax: 500,
      trustScoreMin: 0,
      page: 1,
      pageSize: 12,
    });
  };

  const applyFilters = () => {
    // loại bỏ các giá trị rỗng trước khi gửi
    setFilters((prev) => ({
      ...prev,
      subjectId: tempFilters.subjectId || "",
      city: tempFilters.city || "",
      priceMin: tempFilters.priceMin,
      priceMax: tempFilters.priceMax,
      trustScoreMin: tempFilters.trustScoreMin,
      page: 1,
      pageSize: tempFilters.pageSize,
    }));

    mutate();
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-8 sticky top-0 z-40 shadow-lg backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-2 animate-fade-in-up">
            Discover Expert Tutors
          </h1>
          <p className="text-white/90 animate-fade-in-up delay-100">
            Find the perfect tutor matched to your learning goals
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="group glass rounded-2xl p-6 h-fit border border-white/20 sticky top-32 backdrop-blur-xl hover:border-white/30 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" />
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Filters
                </h2>
              </div>

              <div className="space-y-6">
                {/* Subject */}
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Subject
                  </label>
                  <select
                    value={tempFilters.subjectId}
                    onChange={(e) =>
                      handleTempChange("subjectId", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-white/50"
                  >
                    <option value="" className="bg-slate-900">
                      All Subjects
                    </option>
                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                        className="bg-slate-900"
                      >
                        {subject.name} - {subject.level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="animate-fade-in-up delay-100">
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={tempFilters.city}
                      onChange={(e) => handleTempChange("city", e.target.value)}
                      placeholder="Enter city"
                      className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-white/50"
                    />
                  </div>
                </div>

                {/* Price & TrustScore */}
                <div className="animate-fade-in-up delay-200">
                  <label className="block text-sm font-semibold text-white/90 mb-3">
                    Max Price:{" "}
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ${tempFilters.priceMax}/hour
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={tempFilters.priceMax}
                    onChange={(e) =>
                      handleTempChange("priceMax", Number(e.target.value))
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="animate-fade-in-up delay-300">
                  <label className="block text-sm font-semibold text-white/90 mb-3">
                    Min Trust Score:{" "}
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {tempFilters.trustScoreMin}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempFilters.trustScoreMin}
                    onChange={(e) =>
                      handleTempChange("trustScoreMin", Number(e.target.value))
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                {/* Buttons */}
                {/* Buttons */}
                <button
                  onClick={applyFilters}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
    ${"bg-green-600 hover:bg-green-700 active:scale-95 text-white shadow-lg shadow-green-500/20"}
  `}
                >
                  Find
                </button>

                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 animate-fade-in-up delay-400 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Tutors Grid */}
            <div className="col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-purple-600 to-pink-600" />
                </div>
              ) : tutors.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {tutors.map((item, idx) => (
                    <TutorCard key={item.tutor.id} tutor={item.tutor} />
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl p-12 text-center border border-white/20 backdrop-blur-xl animate-fade-in">
                  <p className="text-white/70 text-lg mb-4">
                    No tutors found matching your criteria
                  </p>
                  <button
                    onClick={resetFilters}
                    className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20"
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
