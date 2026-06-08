import React, { useState, useEffect } from 'react';
import { projectsService } from '../services/projects.service';
import { skillsService } from '../services/skills.service';
import { EmptyState } from '../components/EmptyState';
import { ProjectCard, Project } from '../components/ProjectCard';
import { FilterBar } from '../components/FilterBar';
import { Button } from '../components/Button';

interface Skill {
  id: number;
  name: string;
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse flex flex-col h-56 justify-between">
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-4 w-5/6 bg-gray-100 rounded mb-4"></div>
    </div>
    <div className="flex gap-2 pt-2 border-t border-gray-100 justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
        <div className="h-4 w-20 bg-gray-100 rounded"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
    </div>
  </div>
);

const ExploreProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);

  // Fetch Skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsData = await skillsService.getAllSkills();
        setSkillsList(skillsData);
      } catch (err) {
        console.error('Failed to load skills list:', err);
      }
    };
    fetchSkills();
  }, []);

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectsService.getProjects({
          search: search || undefined,
          category: category || undefined,
          skill: skill || undefined,
          status: status || undefined,
          page,
          limit: 6
        });
        setProjects(data.projects || []);
        setPagination(data.pagination || null);
      } catch (err: any) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Add debouncer for search
    const delayDebounceFn = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, category, skill, status, page]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setSkill('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Explore Projects</h1>
        <p className="text-lg text-gray-600">Find the perfect team and start building something amazing.</p>
      </header>

      {/* Filters Bar */}
      <FilterBar
        search={search}
        category={category}
        skill={skill}
        status={status}
        skillsList={skillsList}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        onCategoryChange={(val) => { setCategory(val); setPage(1); }}
        onSkillChange={(val) => { setSkill(val); setPage(1); }}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading && projects.length === 0 ? (
        // Loading Skeleton State
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {/* Responsive Grid Layout (1 col mobile, 2 cols tablet, 3 cols desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-10">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-gray-700">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description="We couldn't find any projects matching your criteria. Adjust your filters or try a different search keyword."
          action={{
            label: 'Clear Filters',
            onClick: handleClearFilters
          }}
        />
      )}
    </div>
  );
};

export default ExploreProjectsPage;