import React from 'react';
import { EmptyState } from '../components/EmptyState';

const MyApplicationsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Applications</h1>
      <EmptyState
        title="Applications Coming Soon"
        description="Your project applications and their status will be available once we complete the application system."
      />
    </div>
  );
};

export default MyApplicationsPage;