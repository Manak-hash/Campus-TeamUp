import React from 'react';

interface StatusBadgeProps {
  status: 'open' | 'full' | 'closed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    open: 'bg-green-100 text-green-800 border-green-200',
    full: 'bg-orange-100 text-orange-800 border-orange-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
