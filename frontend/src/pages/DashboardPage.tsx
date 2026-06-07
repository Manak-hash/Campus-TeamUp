import React from 'react';
import { EmptyState } from '../components/EmptyState';

const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <EmptyState
        title="Dashboard Coming Soon"
        description="Your personalized dashboard with project recommendations and updates will be available soon."
      />
    </div>
  );
};

export default DashboardPage;