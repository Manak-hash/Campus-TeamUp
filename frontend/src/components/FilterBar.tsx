import React from 'react';
import { Input } from './Input';
import { Select } from './Select';

interface Skill {
  id: number;
  name: string;
}

interface FilterBarProps {
  search: string;
  category: string;
  skill: string;
  status: string;
  skillsList: Skill[];
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onSkillChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  category,
  skill,
  status,
  skillsList,
  onSearchChange,
  onCategoryChange,
  onSkillChange,
  onStatusChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          label="Search Keywords"
          name="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title, description..."
        />
        <Select
          label="Category"
          name="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[
            { value: 'web-development', label: 'Web Development' },
            { value: 'mobile-development', label: 'Mobile Development' },
            { value: 'data-science', label: 'Data Science' },
            { value: 'machine-learning', label: 'Machine Learning' },
            { value: 'design', label: 'Design' },
            { value: 'other', label: 'Other' }
          ]}
          placeholder="All Categories"
        />
        <Select
          label="Required Skill"
          name="skill"
          value={skill}
          onChange={(e) => onSkillChange(e.target.value)}
          options={skillsList.map((s) => ({ value: String(s.id), label: s.name }))}
          placeholder="All Skills"
        />
        <Select
          label="Project Status"
          name="status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'full', label: 'Full' },
            { value: 'closed', label: 'Closed' }
          ]}
          placeholder="All Statuses"
        />
      </div>
    </div>
  );
};

export default FilterBar;
