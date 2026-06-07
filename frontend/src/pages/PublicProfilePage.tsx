import React from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

const PublicProfilePage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4">
      <EmptyState
        title="User Profile Coming Soon"
        description={`Profile for user #${id} will be available once we complete our implementation.`}
      />
    </div>
  );
};

export default PublicProfilePage;