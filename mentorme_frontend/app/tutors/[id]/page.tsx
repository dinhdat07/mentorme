"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import useSWR from "swr";
import { TutorProfile, Class } from "@/lib/types";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuthContext } from "@/components/auth-provider";
import { Star, BookOpen, Award, Users, Zap, MapPin } from "lucide-react";

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const tutorId = params.id as string;

  const { data: tutor, isLoading: tutorLoading } = useSWR<TutorProfile>(
    `/api/tutors/${tutorId}`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const { data: classes, isLoading: classesLoading } = useSWR<Class[]>(
    `/api/tutors/${tutorId}/classes`,
    apiClient.get,
    { revalidateOnFocus: false }
  );
  console.log("Id", tutorId);
  console.log("class", classes);

  const { data: reviews, isLoading: reviewsLoading } = useSWR<any[]>(
    `/api/tutors/${tutorId}/reviews`,
    apiClient.get,
    { revalidateOnFocus: false }
  );

  const handleBookClass = (classId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "STUDENT") {
      alert("Only students can book classes");
      return;
    }
    router.push(`/classes/${classId}/book`);
  };

  if (tutorLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </main>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-lg mb-4">Tutor not found</p>
            <Link
              href="/tutors"
              className="text-purple-400 hover:text-purple-300 transition"
            >
              Back to Tutors
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-8 mb-8 border border-purple-500/20 animate-fade-in shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Tutor Profile
                </h1>
                <p className="text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {tutor.city || "Location not specified"}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-4xl font-bold text-yellow-400">
                    {tutor.averageRating.toFixed(1)}
                  </span>
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-slate-400">{tutor.totalReviews} reviews</p>
              </div>
            </div>

            {/* Trust & Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400">Trust Score</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {tutor.trustScore.toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400">Completed Classes</p>
                <p className="text-2xl font-bold text-green-400">
                  {tutor.totalCompletedBookings}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400">Experience</p>
                <p className="text-2xl font-bold text-blue-400">
                  {tutor.yearsOfExperience}y
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400">Verified</p>
                <p className="text-2xl font-bold text-green-400">
                  {tutor.verified ? "✓" : "✗"}
                </p>
              </div>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  About
                </h2>
                <p className="text-slate-300 leading-relaxed">{tutor.bio}</p>
              </div>
            )}

            {/* Education */}
            {tutor.education && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Education
                </h2>
                <p className="text-slate-300">{tutor.education}</p>
              </div>
            )}

            {/* Teaching Modes & Price */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700/50">
              <div>
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Teaching Modes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.teachingModes.map((mode) => (
                    <span
                      key={mode}
                      className="px-3 py-1 bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-purple-200 rounded-full text-sm border border-purple-500/50"
                    >
                      {mode === "ONLINE"
                        ? "Online"
                        : mode === "AT_STUDENT"
                        ? "At Student"
                        : "At Tutor"}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white mb-3">Hourly Rate</h3>
                {tutor.hourlyRateMin && tutor.hourlyRateMax && (
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${tutor.hourlyRateMin} - ${tutor.hourlyRateMax}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Classes */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Available Classes
            </h2>
            {classesLoading ? (
              <p className="text-slate-400">Loading classes...</p>
            ) : classes && classes.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {classes.map((cls, idx) => (
                  <div
                    key={cls.id}
                    className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition duration-300 shadow-lg hover:shadow-purple-500/20 hover:scale-105 transform cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition">
                      {cls.title}
                    </h3>
                    <p className="text-slate-400 mb-4 line-clamp-2 text-sm">
                      {cls.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-slate-300">
                        <span className="text-purple-400 font-semibold">
                          ${cls.pricePerHour}
                        </span>
                        /hour
                      </p>
                      <p className="text-sm text-slate-400">
                        Status:{" "}
                        <span className="text-green-400">{cls.status}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleBookClass(cls.id)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                    >
                      Book Class
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
                No classes available
              </p>
            )}
          </div>
          {/* Reviews */}
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Student Reviews
            </h2>
            {reviewsLoading ? (
              <p className="text-slate-400">Loading reviews...</p>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div
                    key={review.id}
                    className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 hover:border-purple-500/30 transition duration-300 shadow-lg hover:shadow-purple-500/10 animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-white">
                        Student {review.studentId.slice(0, 8)}
                      </p>
                      <p className="flex items-center gap-1 text-yellow-400 font-bold">
                        {review.rating}
                        <Star className="w-4 h-4 fill-yellow-400" />
                      </p>
                    </div>
                    {review.comment && (
                      <p className="text-slate-300">{review.comment}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
                No reviews yet
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
