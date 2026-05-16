interface SkillBadgeProps {
  name: string
  proficiency: string
  onRemove?: () => void
}

export default function SkillBadge({ name, proficiency, onRemove }: SkillBadgeProps) {
  const getProficiencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-100'
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-100'
      case 'advanced': return 'text-purple-600 bg-purple-50 border-purple-100'
      default: return 'text-gray-600 bg-gray-50 border-gray-100'
    }
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProficiencyColor(proficiency)}`}>
      {name}
      <span className="ml-2 text-xs opacity-70">({proficiency})</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 hover:text-red-600 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
