// Simple fetch-based API client
class APIClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`
    
    // Add auth token if available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge with existing headers
    if (options.headers) {
      if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers)
      }
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token')
            window.location.href = '/auth/signin'
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new APIClient()
