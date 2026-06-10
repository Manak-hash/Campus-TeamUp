import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';
import { bookmarksService } from '../services/bookmarks.service';
import { useToast } from '../context/ToastContext';

import type { Project, ProjectSkill } from '../types';
export type { Project, ProjectSkill };

interface ProjectCardProps {
  project: Project;
  onBookmarkToggle?: (projectId: number, isBookmarked: boolean) => void;
}

const getCategoryLabel = (cat: string) => {
  switch (cat.toLowerCase()) {
    case 'web-development': return 'Web Development';
    case 'mobile-development': return 'Mobile Development';
    case 'data-science': return 'Data Science';
    case 'machine-learning': return 'Machine Learning';
    case 'design': return 'Design';
    default: return cat.replace('-', ' ');
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onBookmarkToggle }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSaved, setIsSaved] = React.useState(project.is_bookmarked ?? false);
  const [isMutating, setIsMutating] = React.useState(false);

  React.useEffect(() => {
    setIsSaved(project.is_bookmarked ?? false);
  }, [project.is_bookmarked]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showError('Please log in to save projects.');
      return;
    }

    if (isMutating) return;

    const previousSaved = isSaved;
    setIsSaved(!previousSaved);
    setIsMutating(true);

    try {
      if (previousSaved) {
        await bookmarksService.removeBookmark(project.id);
        showSuccess('Project removed from bookmarks');
      } else {
        await bookmarksService.addBookmark(project.id);
        showSuccess('Project saved to bookmarks');
      }
      if (onBookmarkToggle) {
        onBookmarkToggle(project.id, !previousSaved);
      }
    } catch (err: any) {
      setIsSaved(previousSaved);
      showError(err.response?.data?.error || 'Failed to update bookmark');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <Card
      className="h-full flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      header={
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
            {getCategoryLabel(project.category)}
          </span>
          <div className="flex items-center space-x-2">
            {project.skill_match_score !== undefined && project.skill_match_score !== null && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                project.skill_match_score >= 70
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : project.skill_match_score >= 40
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`} title="Skill match with your profile">
                {project.skill_match_score}% Match
              </span>
            )}
            <StatusBadge status={project.status} />
            <button
              onClick={handleBookmarkClick}
              disabled={isMutating}
              className={`p-1 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isSaved
                  ? 'text-primary-600 hover:text-primary-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={isSaved ? 'Unsave Project' : 'Save Project'}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <Avatar
                src={project.owner_avatar || undefined}
                alt={project.owner_name || 'User'}
                name={project.owner_name || 'U'}
                size="sm"
              />
            </div>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[110px]" title={project.owner_name}>
              {project.owner_name}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">
                {project.member_count}
              </span>
              <span className="text-xs text-gray-500">
                /{project.max_members} members
              </span>
            </div>
            <Link to={`/projects/${project.slug}`}>
              <Button size="sm">Details</Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-1">
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>

        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {(project.skills || []).slice(0, 4).map((s) => (
            <span
              key={s.id}
              className={`text-xs px-2 py-0.5 rounded border ${
                s.importance === 'required'
                  ? 'bg-primary-50 text-primary-700 border-primary-100 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}
              title={s.importance === 'required' ? 'Required skill' : 'Nice to have skill'}
            >
              {s.name}
            </span>
          ))}
          {(project.skills || []).length > 4 && (
            <span className="text-xs text-gray-400 py-0.5 px-1">
              +{(project.skills || []).length - 4} more
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
