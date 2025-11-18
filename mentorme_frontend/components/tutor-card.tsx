'use client';

import Link from 'next/link';
import { TutorProfile } from '@/lib/types';

interface TutorCardProps {
  tutor: TutorProfile;
}

export const TutorCard = ({ tutor }: TutorCardProps) => {
  return (
    <Link href={`/tutors/${tutor.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition h-full">
        <div className="p-6">
          {/* Tutor Info */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">{tutor.userId}</h3>
          
          {/* Bio Preview */}
          {tutor.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tutor.bio}</p>
          )}

          {/* Education */}
          {tutor.education && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 font-medium">Education</p>
              <p className="text-sm text-gray-700">{tutor.education.substring(0, 50)}...</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{tutor.averageRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{tutor.trustScore.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Trust</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{tutor.totalCompletedBookings}</p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
          </div>

          {/* Experience & Price */}
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            <p>Experience: {tutor.yearsOfExperience} years</p>
            {tutor.hourlyRateMin && tutor.hourlyRateMax && (
              <p className="font-semibold text-blue-600">
                ${tutor.hourlyRateMin} - ${tutor.hourlyRateMax}/hour
              </p>
            )}
            {tutor.city && <p>Location: {tutor.city}</p>}
          </div>

          {/* Teaching Modes */}
          {tutor.teachingModes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tutor.teachingModes.map((mode) => (
                <span
                  key={mode}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {mode === 'ONLINE' ? 'Online' : mode === 'AT_STUDENT' ? 'At Student' : 'At Tutor'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Profile Button */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-center text-blue-600 font-medium text-sm">View Profile →</p>
        </div>
      </div>
    </Link>
  );
};
