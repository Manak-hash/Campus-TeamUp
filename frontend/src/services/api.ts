import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/api/profile', {
      headers: { 'User-Id': '1' } // Mock auth
    })
    return response.data
  },
  getUserProfile: async (id: string) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/profile', data, {
      headers: { 'User-Id': '1' } // Mock auth
    })
    return response.data
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/api/profile/avatar', formData, {
      headers: { 
        'User-Id': '1', // Mock auth
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  getSkills: async () => {
    const response = await api.get('/api/skills')
    return response.data
  },
  updateSkills: async (skills: { skill_id: number, proficiency_level: string }[]) => {
    const response = await api.put('/api/profile/skills', { skills }, {
      headers: { 'User-Id': '1' } // Mock auth
    })
    return response.data
  }
}

export default api
