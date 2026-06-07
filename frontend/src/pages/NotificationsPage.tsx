import React from 'react';
import { EmptyState } from '../components/EmptyState';

const NotificationsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
      <EmptyState
        title="Notifications Coming Soon"
        description="Your notifications for project updates and application responses will appear here."
      />
    </div>
  );
};

export default NotificationsPage;