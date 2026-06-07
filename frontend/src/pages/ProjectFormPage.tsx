import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';
import { projectService } from '../services/api';

const ProjectFormPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    max_members: 2,
    deadline: '',
    skills: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate form data before sending
    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      setLoading(false);
      return;
    }

    if (formData.max_members < 2 || formData.max_members > 10) {
      setError('Max members must be between 2 and 10');
      setLoading(false);
      return;
    }

    console.log('Submitting project data:', formData);

    try {
      if (slug) {
        await projectService.updateProject(slug, formData);
      } else {
        await projectService.createProject(formData);
      }
      navigate('/projects');
    } catch (err: any) {
      console.error('Project creation error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to save project';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {slug ? 'Edit Project' : 'Create New Project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Project Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="My Awesome Project"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Describe your project..."
            rows={4}
          />
        </div>

        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          options={[
            { value: '', label: 'Select a category' },
            { value: 'web-development', label: 'Web Development' },
            { value: 'mobile-development', label: 'Mobile Development' },
            { value: 'data-science', label: 'Data Science' },
            { value: 'machine-learning', label: 'Machine Learning' },
            { value: 'design', label: 'Design' },
            { value: 'other', label: 'Other' }
          ]}
        />

        <Input
          label="Max Members"
          type="number"
          min="2"
          max="10"
          value={formData.max_members}
          onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 2 })}
          required
        />

        <Input
          label="Deadline (Optional)"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : slug ? 'Update Project' : 'Create Project'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/projects')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectFormPage;