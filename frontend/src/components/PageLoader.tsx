import React from 'react';
import { Spinner } from './Spinner';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="text-primary-600">
          <Spinner size="lg" />
        </div>
        <p className="text-sm font-semibold text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default PageLoader;
