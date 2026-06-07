import React from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4">
      <EmptyState
        title="Project Details Coming Soon"
        description={`Project "${slug}" details will be available once we complete our backend implementation.`}
      />
    </div>
  );
};

export default ProjectDetailPage;