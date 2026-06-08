import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile.service';
import type { User } from '../types';
import { PageLoader } from '../components/PageLoader';

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await profileService.getUserProfile(id);
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching public profile:', err);
        setError('Failed to load this student\'s profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This user might not exist or the profile cannot be loaded.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Banner with modern gradient */}
        <div className="h-40 bg-gradient-to-r from-primary-600 to-indigo-600 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition-colors border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-8 md:px-8">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-16 mb-6 gap-4">
            <img
              src={
                profile.avatar_url
                  ? profile.avatar_url.startsWith('http')
                    ? profile.avatar_url
                    : `http://localhost:8000${profile.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=14b8a6&color=fff&size=128`
              }
              alt={profile.name}
              className="w-32 h-32 rounded-full border-4 border-white bg-gray-50 object-cover shadow-md mx-auto md:mx-0"
            />
            <div className="flex-1 text-center md:text-left mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5 justify-center md:justify-start">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{profile.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 self-center capitalize">
                  {profile.role}
                </span>
              </div>
              <p className="text-gray-500 font-medium flex flex-wrap gap-2 items-center justify-center md:justify-start">
                {profile.department && <span>{profile.department}</span>}
                {profile.department && profile.academic_level && <span className="text-gray-300">•</span>}
                {profile.academic_level && <span>{profile.academic_level}</span>}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-100 pt-8">
            {/* Bio & Details Column */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">About Student</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'This student hasn\'t added a biography yet.'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Academic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1">{profile.department || 'Not specified'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Level</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1">{profile.academic_level || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Skills & Expertise</h3>
                <div className="flex flex-col gap-2.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl shadow-sm text-sm"
                      >
                        <span className="font-bold text-gray-800">{skill.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                            skill.proficiency_level === 'advanced'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : skill.proficiency_level === 'intermediate'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {skill.proficiency_level}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <h4 className="text-sm font-bold text-primary-900 mb-1">Looking to collaborate?</h4>
                <p className="text-xs text-primary-700 mb-3 leading-relaxed">
                  Send them an invitation by applying to their open projects or invite them to join yours.
                </p>
                <a
                  href={`mailto:${profile.email}`}
                  className="block w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-xs font-bold shadow-sm"
                >
                  Contact via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;