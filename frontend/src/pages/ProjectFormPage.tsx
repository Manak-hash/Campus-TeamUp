import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';
import { projectsService } from '../services/projects.service';
import { ProjectSkillPicker, type SelectedProjectSkill } from '../components/ProjectSkillPicker';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/PageLoader';

const ProjectFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    max_members: 2,
    status: 'open' as 'open' | 'full' | 'closed',
    deadline: '',
  });

  const [selectedSkills, setSelectedSkills] = useState<SelectedProjectSkill[]>([]);

  // Fetch project details for pre-filling in edit mode
  useEffect(() => {
    if (!slug) return;

    const fetchProject = async () => {
      try {
        setInitialLoading(true);
        const data = await projectsService.getProject(slug);
        
        // Format deadline date for HTML input YYYY-MM-DD
        let formattedDeadline = '';
        if (data.deadline) {
          formattedDeadline = new Date(data.deadline).toISOString().split('T')[0];
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          max_members: data.max_members || 2,
          status: data.status || 'open',
          deadline: formattedDeadline,
        });

        // Map skills to picker format
        if (data.required_skills) {
          const mappedSkills = data.required_skills.map((s: any) => ({
            skill_id: s.id,
            name: s.name,
            importance: s.importance || 'required',
          }));
          setSelectedSkills(mappedSkills);
        } else if ((data as any).skills) {
          const mappedSkills = (data as any).skills.map((s: any) => ({
            skill_id: s.id,
            name: s.name,
            importance: s.importance || 'required',
          }));
          setSelectedSkills(mappedSkills);
        }
      } catch (err: any) {
        console.error('Failed to load project details for editing:', err);
        showError('Failed to load project details.');
        navigate('/explore');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProject();
  }, [slug, navigate, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (formData.max_members < 2 || formData.max_members > 10) {
      setError('Max members must be between 2 and 10.');
      return;
    }

    if (formData.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(formData.deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        setError('Deadline cannot be in the past.');
        return;
      }
    }

    setLoading(true);

    // Prepare payload
    // backend expects skills in format: { skills: [{ skill_id: number; importance: string }] }
    // All selected skills have skill_id because custom ones are created inline in the picker.
    const skillPayload = selectedSkills
      .filter((s) => s.skill_id !== undefined)
      .map((s) => ({
        skill_id: s.skill_id!,
        importance: s.importance,
      }));

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      max_members: formData.max_members,
      deadline: formData.deadline || null,
      skills: skillPayload,
      ...(slug ? { status: formData.status } : {}), // only include status when editing
    };

    try {
      if (slug) {
        const response = await projectsService.updateProject(slug, payload);
        showSuccess(response.message || 'Project updated successfully!');
        navigate(`/projects/${response.project?.slug || slug}`);
      } else {
        const response = await projectsService.createProject(payload);
        showSuccess(response.message || 'Project created successfully!');
        navigate(`/projects/${response.project?.slug}`);
      }
    } catch (err: any) {
      console.error('Project submission error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to save project. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {slug ? 'Edit Project Details' : 'Launch a New Project'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {slug
              ? 'Keep your project requirements and details up-to-date to attract the best matching team members.'
              : 'Fill out the details below to publish your project and start assembling your dream team.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Project Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g. Study Group Finder, Campus Food Delivery..."
            helper="Keep it clear and descriptive. Minimum 5 characters."
            error={formData.title && formData.title.trim().length < 5 ? 'Title is too short' : undefined}
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Describe your project, technology stack, and who you are looking to collaborate with..."
            rows={5}
            helper="Detailed descriptions help other students understand your vision and goals."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="Select a category"
              options={[
                { value: 'web-development', label: 'Web Development' },
                { value: 'mobile-development', label: 'Mobile Development' },
                { value: 'data-science', label: 'Data Science' },
                { value: 'machine-learning', label: 'Machine Learning' },
                { value: 'design', label: 'Design' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Input
              label="Maximum Team Members"
              type="number"
              min="2"
              max="10"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 2 })}
              required
              helper="Specify size of team including yourself (2 - 10 members)."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Application Deadline (Optional)"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              helper="Applications will close after this date."
            />

            {slug && (
              <Select
                label="Project Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                required
                options={[
                  { value: 'open', label: 'Open - Accepting Applications' },
                  { value: 'full', label: 'Full - Team is complete' },
                  { value: 'closed', label: 'Closed - Applications closed' },
                ]}
              />
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Skills Required & Nice to Have
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Search and add the key technologies, frameworks, or design skills required for your team. You can create custom skills if they do not exist.
            </p>
            <ProjectSkillPicker
              selectedSkills={selectedSkills}
              onChange={setSelectedSkills}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-4 border-t border-gray-100 pt-6">
            <Button type="submit" loading={loading} disabled={loading} size="lg">
              {slug ? 'Save Changes' : 'Publish Project'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => (slug ? navigate(`/projects/${slug}`) : navigate('/explore'))}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormPage;