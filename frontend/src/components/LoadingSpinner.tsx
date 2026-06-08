import React from 'react';
import { Spinner } from './Spinner';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-primary-600">
      <Spinner size={size} />
      {message && (
        <p className="mt-3 text-sm font-medium text-gray-500">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
