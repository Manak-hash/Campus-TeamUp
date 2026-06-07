import React from 'react';
import { EmptyState } from '../components/EmptyState';

const ExploreProjectsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore Projects</h1>
      <EmptyState
        title="Projects Coming Soon"
        description="We're currently setting up our project database. Check back soon to discover amazing team opportunities!"
      />
    </div>
  );
};

export default ExploreProjectsPage;