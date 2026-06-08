import { useState, useEffect } from 'react'
import { skillsService } from '../services/skills.service'
import SkillBadge from './SkillBadge'

interface Skill {
  id: number
  name: string
}

interface UserSkill {
  id: number
  name: string
  proficiency_level: string
}

interface SkillPickerProps {
  selectedSkills: UserSkill[]
  onChange: (skills: UserSkill[]) => void
}

export default function SkillPicker({ selectedSkills, onChange }: SkillPickerProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState<string>('')
  const [proficiency, setProficiency] = useState<string>('beginner')

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await skillsService.getAllSkills()
        setAllSkills(data)
      } catch (err) {
        console.error('Failed to fetch skills', err)
      }
    }
    fetchSkills()
  }, [])

  const handleAddSkill = () => {
    if (!selectedSkillId) return
    
    const skill = allSkills.find(s => s.id === parseInt(selectedSkillId))
    if (!skill) return

    // Check if already selected
    if (selectedSkills.some(s => s.id === skill.id)) return

    const newSkill: UserSkill = {
      id: skill.id,
      name: skill.name,
      proficiency_level: proficiency
    }

    onChange([...selectedSkills, newSkill])
    setSelectedSkillId('')
  }

  const handleRemoveSkill = (id: number) => {
    onChange(selectedSkills.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedSkills.map(skill => (
          <SkillBadge 
            key={skill.id}
            name={skill.name}
            proficiency={skill.proficiency_level}
            onRemove={() => handleRemoveSkill(skill.id)}
          />
        ))}
        {selectedSkills.length === 0 && (
          <p className="text-sm text-gray-500 italic">No skills selected yet.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedSkillId}
          onChange={(e) => setSelectedSkillId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a skill...</option>
          {allSkills
            .filter(s => !selectedSkills.some(ss => ss.id === s.id))
            .map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))
          }
        </select>

        <select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
          className="block w-full sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <button
          type="button"
          onClick={handleAddSkill}
          disabled={!selectedSkillId}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add Skill
        </button>
      </div>
    </div>
  )
}
