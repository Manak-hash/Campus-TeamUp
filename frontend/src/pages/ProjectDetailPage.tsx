import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsService } from '../services/projects.service';
import { profileService } from '../services/profile.service';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ApplicationModal from '../components/ApplicationModal';
import ApplicationsPanel from '../components/ApplicationsPanel';

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  owner_avatar: string | null;
  max_members: number;
  member_count: number;
  deadline: string | null;
  status: 'open' | 'full' | 'closed';
  skills: { id: number; name: string; importance: 'required' | 'nice_to_have' }[];
  members: {
    id: number;
    name: string;
    email: string;
    member_avatar: string | null;
    role: string;
    skills: { id: number; name: string; proficiency_level: string }[];
  }[];
  user_application_status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | null;
}

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await projectsService.getProject(slug);
      setProject(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.status === 404 ? '404' : 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const data = await profileService.getProfile();
      setUserProfile(data);
    } catch (err) {
      console.error('Failed to load user profile for skill matching:', err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [slug]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const handleApplySubmit = async (message: string) => {
    if (!project) return;
    await projectsService.applyToProject(project.id, message);
    // Refresh details to update application status badge
    await fetchProjectDetails();
  };

  const handleDelete = async () => {
    if (!project) return;
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectsService.deleteProject(project.id.toString());
        navigate('/explore');
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete project.');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error === '404' || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Project Not Found</h1>
        <p className="mt-4 text-base text-gray-500 max-w-md mx-auto">
          The project you are looking for might have been deleted, renamed, or is temporarily unavailable.
        </p>
        <div className="mt-6">
          <Link to="/explore">
            <Button variant="primary">Back to Explore Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && project.owner_id === user.id;
  const isMember = project.members.some((m) => m.id === user?.id);

  // Skill matching
  const requiredSkills = project.skills.filter((s) => s.importance === 'required');
  const niceToHaveSkills = project.skills.filter((s) => s.importance === 'nice_to_have');
  const userSkillNames = new Set(userProfile?.skills?.map((s: any) => s.name.toLowerCase()) || []);
  const matchedCount = requiredSkills.filter((s) => userSkillNames.has(s.name.toLowerCase())).length;
  const percentMatch = requiredSkills.length > 0 ? Math.round((matchedCount / requiredSkills.length) * 100) : 100;

  const getMatchColorClass = (percent: number) => {
    if (percent >= 75) return 'bg-green-500';
    if (percent >= 40) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getMatchTextClass = (percent: number) => {
    if (percent >= 75) return 'text-green-600';
    if (percent >= 40) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link to="/explore" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Explore
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-60 transform translate-x-8 -translate-y-8" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold bg-primary-50 text-primary-700 rounded-md uppercase tracking-wider">
                {project.category.replace('-', ' ')}
              </span>
              <StatusBadge status={project.status} />
              {project.deadline && (
                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Deadline: {new Date(project.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {project.title}
            </h1>

            <div className="flex items-center space-x-3">
              <Avatar
                src={project.owner_avatar || undefined}
                alt={project.owner_name}
                name={project.owner_name}
                size="sm"
              />
              <span className="text-sm font-medium text-gray-600">
                Created by <span className="font-semibold text-gray-900">{project.owner_name}</span>
              </span>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center space-x-2 shrink-0">
              <Link to={`/projects/${project.slug}/edit`}>
                <Button variant="secondary" size="sm" className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={handleDelete} className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Description, Skills, Review Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Description</h2>
            <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap select-text">
              {project.description}
            </div>
          </div>

          {/* Skills Required */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Project Skills</h2>
            
            {requiredSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold border ${
                        userSkillNames.has(skill.name.toLowerCase())
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-150'
                      }`}
                    >
                      {skill.name}
                      {userSkillNames.has(skill.name.toLowerCase()) ? (
                        <svg className="w-4 h-4 ml-1.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 ml-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {niceToHaveSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Nice to Have</h3>
                <div className="flex flex-wrap gap-2">
                  {niceToHaveSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill Match Indicator (Only for logged-in non-owners) */}
          {user && !isOwner && requiredSkills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Skill Match</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    How your skills align with the required skills of this project.
                  </p>
                </div>
                <div className={`text-3xl font-extrabold ${getMatchTextClass(percentMatch)}`}>
                  {percentMatch}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getMatchColorClass(percentMatch)}`}
                  style={{ width: `${percentMatch}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 leading-normal">
                You match <span className="font-bold text-gray-900">{matchedCount}</span> out of{' '}
                <span className="font-bold text-gray-900">{requiredSkills.length}</span> required skills for this project.
              </p>
            </div>
          )}

          {/* Owners review panel */}
          {isOwner && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Applications Management</h3>
              <ApplicationsPanel projectIdOrSlug={project.id} onMemberAdded={fetchProjectDetails} />
            </div>
          )}

          {/* Applicants action overlay/section */}
          {!isOwner && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Project Join Request</h3>
              {!user ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">You must be logged in to apply for this project.</p>
                  <Link to="/login">
                    <Button variant="primary">Login / Register</Button>
                  </Link>
                </div>
              ) : isMember ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-medium flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You are a member of this project team!
                </div>
              ) : project.user_application_status ? (
                <div className="p-4 rounded-xl border text-sm font-medium flex items-center bg-amber-50 text-amber-700 border-amber-200">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Application Status:{' '}
                  <span className="font-bold ml-1 uppercase">{project.user_application_status}</span>
                </div>
              ) : project.status !== 'open' ? (
                <div className="bg-gray-50 text-gray-700 p-4 rounded-xl border border-gray-200 text-sm font-medium">
                  This project is currently closed or full and not accepting applications.
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-normal">
                    Think you have what it takes? Send a join request describing your motivation and relevance.
                  </p>
                  <Button variant="primary" onClick={() => setIsApplyModalOpen(true)}>
                    Apply to Project
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Owner Card, Team Members List */}
        <div className="space-y-8">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Project Summary</h3>
            <div className="space-y-3.5 text-sm font-medium text-gray-600">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>Status</span>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span>Team Size</span>
                <span className="text-gray-900">
                  {project.member_count} / {project.max_members} members
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Category</span>
                <span className="text-gray-900 capitalize">{project.category.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Owner details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 text-center space-y-4">
            <h3 className="font-bold text-gray-900 text-lg text-left">Project Creator</h3>
            <div className="flex flex-col items-center">
              <Avatar
                src={project.owner_avatar || undefined}
                alt={project.owner_name}
                name={project.owner_name}
                size="lg"
              />
              <h4 className="font-bold text-gray-900 mt-3.5 text-lg leading-snug">{project.owner_name}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{project.owner_email}</p>
              {project.members.find((m) => m.id === project.owner_id)?.skills && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {project.members
                    .find((m) => m.id === project.owner_id)
                    ?.skills.slice(0, 3)
                    .map((s) => (
                      <span key={s.id} className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                        {s.name}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg flex justify-between items-center">
              Team Members
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {project.members.length}
              </span>
            </h3>

            {project.members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 font-medium">No team members yet.</p>
            ) : (
              <div className="space-y-4">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <Avatar
                      src={member.member_avatar || undefined}
                      alt={member.name}
                      name={member.name}
                      size="sm"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                          {member.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            member.role === 'owner'
                              ? 'bg-primary-50 text-primary-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {member.role === 'owner' ? 'Lead' : 'Member'}
                        </span>
                      </div>
                      
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 3).map((s) => (
                            <span key={s.id} className="text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-150 px-1.5 py-0.5 rounded">
                              {s.name}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="text-[9px] font-bold text-gray-400 px-1 py-0.5">
                              +{member.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplySubmit}
        projectName={project.title}
      />
    </div>
  );
};

export default ProjectDetailPage;