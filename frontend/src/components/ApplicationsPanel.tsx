import React, { useEffect, useState } from 'react';
import { projectsService } from '../services/projects.service';
import Avatar from './Avatar';
import SkillBadge from './SkillBadge';
import Button from './Button';
import Spinner from './Spinner';

interface Application {
  id: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  user_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_avatar: string | null;
  skills: { id: number; name: string; proficiency_level: string }[];
}

interface ApplicationsPanelProps {
  projectIdOrSlug: string | number;
  onMemberAdded?: () => void;
}

export const ApplicationsPanel: React.FC<ApplicationsPanelProps> = ({
  projectIdOrSlug,
  onMemberAdded,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await projectsService.getProjectApplications(projectIdOrSlug);
      setApplications(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [projectIdOrSlug]);

  const handleReview = async (appId: number, status: 'accepted' | 'rejected') => {
    setActioningId(appId);
    try {
      await projectsService.reviewApplication(appId, status);
      // Refresh applications list
      await fetchApplications();
      if (status === 'accepted' && onMemberAdded) {
        onMemberAdded();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update application status.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
        <Spinner />
        <span className="ml-3 text-sm text-gray-500 font-medium">Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
        {error}
      </div>
    );
  }

  const pendingApps = applications.filter((app) => app.status === 'pending');
  const pastApps = applications.filter((app) => app.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center">
            Pending Applicants
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">
              {pendingApps.length}
            </span>
          </h3>
        </div>

        {pendingApps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm font-medium">
            No pending join requests for this project.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingApps.map((app) => (
              <div key={app.id} className="p-6 space-y-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={app.applicant_avatar || undefined}
                      alt={app.applicant_name}
                      name={app.applicant_name}
                      size="md"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 leading-snug hover:text-primary-600 cursor-pointer">
                        {app.applicant_name}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{app.applicant_email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Applied {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReview(app.id, 'rejected')}
                      disabled={actioningId === app.id}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReview(app.id, 'accepted')}
                      loading={actioningId === app.id}
                      disabled={actioningId !== null}
                    >
                      Accept
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivation</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.message}</p>
                </div>

                {app.skills && app.skills.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {app.skills.map((skill) => (
                        <SkillBadge
                          key={skill.id}
                          name={skill.name}
                          proficiency={skill.proficiency_level}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Applications Section */}
      {pastApps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-lg">Application History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pastApps.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={app.applicant_avatar || undefined}
                    alt={app.applicant_name}
                    name={app.applicant_name}
                    size="sm"
                  />
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{app.applicant_name}</span>
                    <span className="text-xs text-gray-500 ml-2">({app.applicant_email})</span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      app.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPanel;
