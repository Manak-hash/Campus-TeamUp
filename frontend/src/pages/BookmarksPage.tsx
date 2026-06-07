import React from 'react';
import { EmptyState } from '../components/EmptyState';

const BookmarksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bookmarked Projects</h1>
      <EmptyState
        title="Bookmarks Coming Soon"
        description="Your saved projects will appear here once we complete the bookmarking system."
      />
    </div>
  );
};

export default BookmarksPage;