import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

export const authService = {
  register: async (data: any) => {
    const response = await api.post('/api/register', data)
    return response.data
  },
  login: async (credentials: any) => {
    const response = await api.post('/api/login', credentials)
    return response.data
  },
  logout: async () => {
    const response = await api.post('/api/logout')
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/api/me')
    return response.data
  }
}

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/api/profile')
    return response.data
  },
  getUserProfile: async (id: string) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/profile', data)
    return response.data
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/api/profile/avatar', formData, {
      headers: {
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
    const response = await api.put('/api/profile/skills', { skills })
    return response.data
  }
}

export const projectService = {
  getProjects: async (params?: any) => {
    const response = await api.get('/api/projects', { params })
    return response.data
  },
  getProject: async (id: string) => {
    const response = await api.get(`/api/projects/${id}`)
    return response.data
  },
  createProject: async (data: any) => {
    const response = await api.post('/api/projects', data)
    return response.data
  },
  updateProject: async (id: string, data: any) => {
    const response = await api.put(`/api/projects/${id}`, data)
    return response.data
  },
  deleteProject: async (id: string) => {
    const response = await api.delete(`/api/projects/${id}`)
    return response.data
  }
}

export default api
