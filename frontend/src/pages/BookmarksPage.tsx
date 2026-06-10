import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarksService } from '../services/bookmarks.service';
import { EmptyState } from '../components/EmptyState';
import { ProjectCard } from '../components/ProjectCard';
import type { Bookmark } from '../types';

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse flex flex-col h-56 justify-between">
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-4 w-5/6 bg-gray-100 rounded mb-4"></div>
    </div>
    <div className="flex gap-2 pt-2 border-t border-gray-100 justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
        <div className="h-4 w-20 bg-gray-100 rounded"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
    </div>
  </div>
);

const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarksService.getBookmarks();
      // Ensure we extract the data array
      setBookmarks(response.data || []);
    } catch (err: any) {
      console.error('Failed to load bookmarks:', err);
      setError('Failed to load your bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (projectId: number, isBookmarked: boolean) => {
    // If it's unsaved, remove it from the list immediately for smooth optimistic filtering
    if (!isBookmarked) {
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.project_id !== projectId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Saved Projects</h1>
        <p className="text-lg text-gray-600">Projects you have bookmarked to follow or apply to later.</p>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => {
            if (!bookmark.project) return null;
            return (
              <ProjectCard
                key={bookmark.project.id}
                project={bookmark.project}
                onBookmarkToggle={handleBookmarkToggle}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-8">
          <EmptyState
            title="No saved projects yet"
            description="Keep track of projects that catch your eye by saving them. They will all show up here."
            action={{
              label: 'Explore Projects',
              onClick: () => navigate('/explore'),
            }}
            icon={
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;