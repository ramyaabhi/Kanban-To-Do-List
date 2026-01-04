// API utility functions

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function getToken() {
  return localStorage.getItem('token')
}

export async function apiRequest(url, options = {}) {
  const token = getToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  })

  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // navigate to SPA login route (use hash to avoid full page reload)
    try {
      window.location.hash = '#/login'
    } catch (e) {
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please login again.')
  }

  return response
}

