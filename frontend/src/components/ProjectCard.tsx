import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { Avatar } from './Avatar';
import { Button } from './Button';

export interface ProjectSkill {
  id: number;
  name: string;
  importance: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'open' | 'full' | 'closed';
  max_members: number;
  member_count: number;
  owner_id: number;
  owner_name: string;
  owner_avatar: string | null;
  skills: ProjectSkill[];
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
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

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card
      className="h-full flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      header={
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
            {getCategoryLabel(project.category)}
          </span>
          <StatusBadge status={project.status} />
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <Avatar
                src={project.owner_avatar || undefined}
                alt={project.owner_name}
                name={project.owner_name}
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
          {project.skills.slice(0, 4).map((s) => (
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
          {project.skills.length > 4 && (
            <span className="text-xs text-gray-400 py-0.5 px-1">
              +{project.skills.length - 4} more
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
