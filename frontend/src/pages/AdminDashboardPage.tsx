import React, { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import type { User, Project, AdminStats } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';

const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users table state
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserRole, setUpdatingUserRole] = useState<number | null>(null);

  // Projects table state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsTotalPages, setProjectsTotalPages] = useState(1);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'user' | 'project';
    id: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await adminService.getStats();
      setStats(res.data);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load platform stats');
    } finally {
      setLoadingStats(false);
    }
  };

  // Load users
  const fetchUsers = async (page: number) => {
    try {
      setLoadingUsers(true);
      const res = await adminService.getUsers(page);
      setUsers(res.data);
      setUsersPage(res.meta.current_page);
      setUsersTotalPages(res.meta.last_page);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load projects
  const fetchProjects = async (page: number) => {
    try {
      setLoadingProjects(true);
      const res = await adminService.getProjects(page);
      setProjects(res.data);
      setProjectsPage(res.meta.current_page);
      setProjectsTotalPages(res.meta.last_page);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(1);
    fetchProjects(1);
  }, []);

  // Handle role toggle
  const handleToggleRole = async (user: User) => {
    if (user.id === currentUser?.id) {
      showError('You cannot demote yourself from admin.');
      return;
    }
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      setUpdatingUserRole(user.id);
      await adminService.updateUserRole(user.id, newRole);
      showSuccess(`Successfully updated ${user.name}'s role to ${newRole}`);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      // Refresh stats in background
      fetchStats();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Handle delete confirmation trigger
  const triggerDelete = (type: 'user' | 'project', id: number, label: string) => {
    if (type === 'user' && id === currentUser?.id) {
      showError('You cannot delete your own admin account.');
      return;
    }
    setConfirmDelete({ type, id, label });
  };

  // Execute deletion
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    try {
      setDeleting(true);
      if (type === 'user') {
        await adminService.deleteUser(id);
        showSuccess('User successfully deleted');
        // Refresh users and stats
        fetchUsers(usersPage);
        fetchStats();
      } else {
        await adminService.deleteProject(id);
        showSuccess('Project successfully deleted');
        // Refresh projects and stats
        fetchProjects(projectsPage);
        fetchStats();
      }
    } catch (err: any) {
      showError(err.response?.data?.error || `Failed to delete ${type}`);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  // Helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loadingStats && loadingUsers && loadingProjects && !stats && users.length === 0 && projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center">
        <LoadingSpinner message="Loading administrative dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform statistics and content moderation panel</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loadingStats ? '...' : stats?.total_users ?? 0}
            </div>
            <div className="text-sm font-semibold text-gray-500">Total Users</div>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loadingStats ? '...' : stats?.total_projects ?? 0}
            </div>
            <div className="text-sm font-semibold text-gray-500">Total Projects</div>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loadingStats ? '...' : stats?.total_applications ?? 0}
            </div>
            <div className="text-sm font-semibold text-gray-500">Total Applications</div>
          </div>
        </div>

        {/* Open Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {loadingStats ? '...' : stats?.open_projects ?? 0}
            </div>
            <div className="text-sm font-semibold text-gray-500">Open Projects</div>
          </div>
        </div>
      </div>

      {/* Main Moderation Layout */}
      <div className="grid grid-cols-1 gap-8">
        {/* Users Moderation Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Moderate Users
            </h2>
            {loadingUsers && <Spinner size="sm" />}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No users registered yet.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={updatingUserRole === user.id || user.id === currentUser?.id}
                          className={`relative px-3 py-1 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                            user.role === 'admin'
                              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                              : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={user.id === currentUser?.id ? 'You cannot demote yourself' : `Change role to ${user.role === 'admin' ? 'student' : 'admin'}`}
                        >
                          {updatingUserRole === user.id && (
                            <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                          {user.role === 'admin' ? 'Admin' : 'Student'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => triggerDelete('user', user.id, user.name)}
                          disabled={user.id === currentUser?.id}
                          className="text-danger hover:text-red-700 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs py-1 px-2.5 rounded hover:bg-red-50 focus:outline-none"
                          title={user.id === currentUser?.id ? 'You cannot delete yourself' : 'Delete user'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={usersPage}
            totalPages={usersTotalPages}
            onPageChange={(page) => fetchUsers(page)}
          />
        </div>

        {/* Projects Moderation Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Moderate Projects
            </h2>
            {loadingProjects && <Spinner size="sm" />}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No projects listed yet.</td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 truncate max-w-xs">{project.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.owner_name || `User ID: ${project.owner_id}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{project.category.replace('-', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(project.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => triggerDelete('project', project.id, project.title)}
                          className="text-danger hover:text-red-700 font-bold transition-colors text-xs py-1 px-2.5 rounded hover:bg-red-50 focus:outline-none"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={projectsPage}
            totalPages={projectsTotalPages}
            onPageChange={(page) => fetchProjects(page)}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete ${confirmDelete.type === 'user' ? 'User Account' : 'Project'}`}
          message={
            confirmDelete.type === 'user'
              ? `Are you sure you want to permanently delete the user account for "${confirmDelete.label}"? All projects they own, their project memberships, and applications will also be deleted. This action cannot be undone.`
              : `Are you sure you want to permanently delete the project "${confirmDelete.label}"? All applications, bookmarks, and memberships associated with it will also be deleted. This action cannot be undone.`
          }
          confirmLabel="Permanently Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
          variant="danger"
        />
      )}
    </div>
  );
};

// Internal Pagination helper component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardPage;