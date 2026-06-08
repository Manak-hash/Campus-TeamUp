import React, { useState, useEffect, useRef } from 'react';
import { skillsService } from '../services/skills.service';
import type { Skill } from '../types';

export interface SelectedProjectSkill {
  skill_id?: number;
  name: string;
  importance: 'required' | 'nice_to_have';
}

interface ProjectSkillPickerProps {
  selectedSkills: SelectedProjectSkill[];
  onChange: (skills: SelectedProjectSkill[]) => void;
}

export const ProjectSkillPicker: React.FC<ProjectSkillPickerProps> = ({
  selectedSkills,
  onChange,
}) => {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState('');
  const [importance, setImportance] = useState<'required' | 'nice_to_have'>('required');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await skillsService.getAllSkills();
        setAllSkills(data);
      } catch (err) {
        console.error('Failed to fetch skills:', err);
      }
    };
    fetchSkills();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSkill = async (skillName: string, id?: number) => {
    const cleanName = skillName.trim();
    if (!cleanName) return;

    // Avoid duplicates
    if (selectedSkills.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      setSearch('');
      setDropdownOpen(false);
      return;
    }

    let skillId = id;
    if (!skillId) {
      try {
        const created = await skillsService.createSkill(cleanName);
        skillId = created.id;
        // Add to allSkills to prevent future duplicates in the dropdown
        setAllSkills(prev => [...prev, created]);
      } catch (err) {
        console.error('Failed to create skill:', err);
        // Fallback: we cannot save a skill without ID due to foreign key constraints,
        // so do not add if creation fails.
        return;
      }
    }

    const newSkill: SelectedProjectSkill = {
      skill_id: skillId,
      name: cleanName,
      importance,
    };

    onChange([...selectedSkills, newSkill]);
    setSearch('');
    setDropdownOpen(false);
  };

  const handleRemoveSkill = (nameToRemove: string) => {
    onChange(selectedSkills.filter((s) => s.name.toLowerCase() !== nameToRemove.toLowerCase()));
  };

  // Filter suggestions
  const filteredSuggestions = allSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedSkills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase())
  );

  const exactMatch = allSkills.find(
    (skill) => skill.name.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Selected Skills Badges */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-lg border border-gray-200">
        {selectedSkills.length === 0 ? (
          <p className="text-sm text-gray-400 italic self-center px-1">
            No skills specified for this project yet.
          </p>
        ) : (
          selectedSkills.map((skill) => (
            <span
              key={skill.name}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                skill.importance === 'required'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-primary-50 text-primary-700 border-primary-200'
              }`}
            >
              <span>{skill.name}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
                  skill.importance === 'required' ? 'bg-red-200 text-red-900' : 'bg-primary-200 text-primary-900'
                }`}
              >
                {skill.importance === 'required' ? 'Req' : 'Nice'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.name)}
                className="hover:opacity-75 focus:outline-none font-bold"
                aria-label={`Remove ${skill.name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Skill Form Section */}
      <div className="flex flex-col sm:flex-row gap-2 relative">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search skills (e.g. React, PHP)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 px-3 border"
          />

          {/* Suggestions Dropdown */}
          {dropdownOpen && (search.trim().length > 0 || filteredSuggestions.length > 0) && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 border border-gray-200 text-sm">
              {filteredSuggestions.map((skill) => (
                <button
                  type="button"
                  key={skill.id}
                  onClick={() => handleAddSkill(skill.name, skill.id)}
                  className="flex w-full items-center px-4 py-2 hover:bg-gray-50 text-gray-700 text-left font-medium"
                >
                  {skill.name}
                </button>
              ))}

              {/* Dynamic Skill Creation Option */}
              {search.trim().length > 0 && !exactMatch && (
                <button
                  type="button"
                  onClick={() => handleAddSkill(search)}
                  className="flex w-full items-center px-4 py-2 hover:bg-primary-50 text-primary-700 text-left font-bold border-t border-gray-100"
                >
                  <span className="mr-1.5">+</span> Add Custom Skill "{search.trim()}"
                </button>
              )}
            </div>
          )}
        </div>

        {/* Importance Dropdown */}
        <select
          value={importance}
          onChange={(e) => setImportance(e.target.value as 'required' | 'nice_to_have')}
          className="block w-full sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 px-2 border"
        >
          <option value="required">Required</option>
          <option value="nice_to_have">Nice to have</option>
        </select>

        {/* Add Button */}
        <button
          type="button"
          onClick={() => {
            if (search.trim()) {
              const matched = allSkills.find(
                (s) => s.name.toLowerCase() === search.trim().toLowerCase()
              );
              handleAddSkill(search, matched?.id);
            }
          }}
          disabled={!search.trim()}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors h-10 shadow-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ProjectSkillPicker;
