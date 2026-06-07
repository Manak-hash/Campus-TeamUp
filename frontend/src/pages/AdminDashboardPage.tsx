import React from 'react';
import { EmptyState } from '../components/EmptyState';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <EmptyState
        title="Admin Panel Coming Soon"
        description="Administrative tools and analytics will be available once we complete the admin system."
      />
    </div>
  );
};

export default AdminDashboardPage;