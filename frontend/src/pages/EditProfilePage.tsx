import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService } from '../services/profile.service'
import SkillPicker from '../components/SkillPicker'

interface UserSkill {
  id: number
  name: string
  proficiency_level: string
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    academic_level: '',
    bio: ''
  })
  const [selectedSkills, setSelectedSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile()
        setFormData({
          name: data.name || '',
          department: data.department || '',
          academic_level: data.academic_level || '',
          bio: data.bio || ''
        })
        setSelectedSkills(data.skills || [])
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url)
        }
      } catch (err) {
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        await profileService.uploadAvatar(avatarFile)
      }

      // Update basic info
      await profileService.updateProfile(formData)
      
      // Update skills
      const skillPayload = selectedSkills.map(s => ({
        skill_id: s.id,
        proficiency_level: s.proficiency_level
      }))
      await profileService.updateSkills(skillPayload)

      setSuccess(true)
      setTimeout(() => navigate('/profile'), 1500)
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto p-6">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          Profile updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white p-6 shadow rounded-lg space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Profile Picture</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img 
                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`} 
                alt="Preview" 
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">Click the camera icon to change your avatar</p>
              <p>JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 shadow rounded-lg space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="academic_level" className="block text-sm font-medium text-gray-700">Academic Level</label>
              <select
                id="academic_level"
                name="academic_level"
                value={formData.academic_level}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Level</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Tell us about yourself..."
            />
          </div>
        </section>

        <section className="bg-white p-6 shadow rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Skills & Expertise</h2>
          <SkillPicker 
            selectedSkills={selectedSkills}
            onChange={setSelectedSkills}
          />
        </section>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
