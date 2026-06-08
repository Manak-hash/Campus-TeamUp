import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { profileService } from '../services/profile.service'
import type { User } from '../types'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = !id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = isOwnProfile 
          ? await profileService.getProfile() 
          : await profileService.getUserProfile(id!)
        setProfile(data)
      } catch (err) {
        setError('Failed to load profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id, isOwnProfile])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">{error || 'Profile not found'}</p>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go back home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header/Banner area */}
        <div className="h-32 bg-indigo-600"></div>
        
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <img
                src={profile.avatar_url ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `http://localhost:8000${profile.avatar_url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 object-cover"
              />
              <div className="ml-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">{profile.department} • {profile.academic_level}</p>
              </div>
            </div>
            {isOwnProfile && (
              <Link 
                to="/profile/edit" 
                className="mb-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profile.bio || "No bio provided yet."}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).length > 0 ? (
                    (profile.skills || []).map(skill => (
                      <span 
                        key={skill.id} 
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
                      >
                        {skill.name} • <span className="capitalize text-indigo-500">{skill.proficiency_level}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No skills listed.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{profile.email}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
