import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsService } from '../services/applications.service';
import { Application } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apps = await applicationsService.getMyApplications();
        setApplications(apps);
      } catch (err) {
        console.error('Failed to fetch stats for dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 transform translate-x-12 -translate-y-12" />
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl leading-relaxed">
            Collaborate on exciting projects, showcase your technical skills, and build your dream team with fellow students.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/explore" className="inline-flex items-center px-5 py-2.5 bg-white text-primary-700 font-bold rounded-xl shadow hover:bg-primary-50 transition-colors">
              Explore Projects
            </Link>
            <Link to="/projects/new" className="inline-flex items-center px-5 py-2.5 bg-primary-700/40 hover:bg-primary-700/60 text-white font-bold rounded-xl border border-primary-400/30 transition-colors">
              Launch Project
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loading ? '...' : applications.length}
            </div>
            <div className="text-sm font-semibold text-gray-500">Sent Applications</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loading ? '...' : pendingCount}
            </div>
            <div className="text-sm font-semibold text-gray-500">Pending Review</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loading ? '...' : acceptedCount}
            </div>
            <div className="text-sm font-semibold text-gray-500">Accepted Requests</div>
          </div>
        </div>
      </div>

      {/* Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Applications Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Manage Applications
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Check the status of your join requests, cancel pending applications, and manage invitations from project team leads.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 mt-4">
            <Link
              to="/applications"
              className="inline-flex items-center text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Go to Applications
              <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Skills & Portfolio Profile
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Keep your profile up-to-date with your academic level, department, biography, and technical skills to maximize your project match rating.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 mt-4">
            <Link
              to="/profile"
              className="inline-flex items-center text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View My Profile
              <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;