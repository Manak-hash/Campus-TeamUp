import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { applicationsService } from '../services/applications.service';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import { Application } from '../types';

const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationsService.getMyApplications();
      setApplications(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this application?')) {
      return;
    }
    try {
      await applicationsService.cancelApplication(id);
      showSuccess('Application cancelled successfully.');
      await fetchApplications();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to cancel application. Please try again.';
      showError(errMsg);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'cancelled':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Applications</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-6 w-1/3 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-1/4 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 max-w-md mx-auto">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchApplications} className="mt-3">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">My Applications</h1>
          <p className="text-sm text-gray-500 mt-2">
            Track and manage your requests to join project teams.
          </p>
        </div>
        <Link to="/explore">
          <Button variant="primary">Browse More Projects</Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No Applications Yet"
          description="You haven't applied to any projects yet. Discover interesting projects and apply to join their teams!"
          action={{
            label: "Explore Projects",
            onClick: () => window.location.href = '/explore'
          }}
        />
      ) : (
        <div className="grid gap-6">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary-50 text-primary-700 rounded uppercase tracking-wider shrink-0">
                    {app.project_category?.replace('-', ' ') || 'Other'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    Applied on {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>

                <Link
                  to={`/projects/${app.project_slug}`}
                  className="block text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors leading-snug truncate"
                >
                  {app.project_title}
                </Link>

                {app.message && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600 italic whitespace-pre-wrap mt-2 select-text">
                    "{app.message}"
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                <div className="flex flex-col md:items-end gap-1.5">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize tracking-wide ${getStatusBadgeStyle(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </div>

                {app.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancel(app.id)}
                    className="md:mt-2"
                  >
                    Cancel Application
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;