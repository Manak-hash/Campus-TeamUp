import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsService } from '../services/projects.service';
import { applicationsService } from '../services/applications.service';
import { Application, Project } from '../types';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [myTeams, setMyTeams] = useState<Project[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ownedData, teamsData, appsData] = await Promise.all([
          projectsService.getMyOwnedProjects(),
          projectsService.getMyTeamProjects(),
          applicationsService.getMyApplications(),
        ]);

        setMyProjects(ownedData.projects || []);
        setMyTeams(teamsData.projects || []);
        // Show only the last 3 applications
        setRecentApplications((appsData || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleDeleteProject = async (projectSlug: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await projectsService.deleteProject(projectSlug);
      // Refresh the projects list
      const ownedData = await projectsService.getMyOwnedProjects();
      setMyProjects(ownedData.projects || []);
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center space-x-4">
        <Avatar
          src={user?.avatar_url || undefined}
          alt={user?.name || 'User'}
          name={user?.name || 'User'}
          size="lg"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects and applications
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link to="/projects/new">
          <Button variant="primary">Post a Project</Button>
        </Link>
        <Link to="/explore">
          <Button variant="secondary">Explore Projects</Button>
        </Link>
      </div>

      {/* My Projects Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
        {myProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="You haven't created any projects. Start by posting your first project!"
            action={{
              label: 'Create Project',
              onClick: () => navigate('/projects/new'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${project.slug}`}
                      className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors block truncate"
                    >
                      {project.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{project.category}</p>
                  </div>
                  {(project.pending_applicant_count || 0) > 0 && (
                    <span className="flex-shrink-0 ml-2 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
                      {project.pending_applicant_count} pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{project.member_count || 0}/{project.max_members} members</span>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/projects/${project.slug}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteProject(project.slug)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Teams Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">My Teams</h2>
        {myTeams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="You haven't joined any project teams. Explore projects and apply to join!"
            action={{
              label: 'Explore Projects',
              onClick: () => navigate('/explore'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTeams.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors block"
                  >
                    {project.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{project.category}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{project.member_count || 0}/{project.max_members} members</span>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <div className="text-xs text-gray-400">
                  Role: {project.user_role || 'member'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
          <Link to="/applications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="You haven't applied to any projects yet. Start exploring and join some teams!"
            action={{
              label: 'Explore Projects',
              onClick: () => navigate('/explore'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <Link
                    to={`/projects/${app.project_slug}`}
                    className="font-bold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {app.project_title}
                  </Link>
                  <StatusBadge status={app.status} size="sm" />
                </div>
                <p className="text-xs text-gray-500">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;