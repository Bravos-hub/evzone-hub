/**
 * API Client
 * Base API client with JWT token handling, refresh logic, and error handling
 */

import { API_CONFIG, DEMO_MODE, TOKEN_STORAGE_KEYS } from './config'
import { ApiException, handleApiError, getErrorMessage } from './errors'
import type { AuthResponse } from './types'

type RequestOptions = RequestInit & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

class ApiClient {
  private baseURL: string
  private refreshPromise: Promise<AuthResponse | null> | null = null

  constructor() {
    this.baseURL = API_CONFIG.baseURL
  }

  /**
   * Get stored access token
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)
  }

  /**
   * Store tokens
   */
  private storeTokens(accessToken: string, refreshToken: string, user?: AuthResponse['user']): void {
    localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, refreshToken)
    if (user) {
      localStorage.setItem(TOKEN_STORAGE_KEYS.user, JSON.stringify(user))
    }
  }

  /**
   * Clear tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.user)
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<AuthResponse | null> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          throw new ApiException('Token refresh failed', response.status)
        }

        const data = (await response.json()) as AuthResponse
        this.storeTokens(data.accessToken, data.refreshToken, data.user)
        return data
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        this.clearTokens()
        // Dispatch event for auth store to handle
        window.dispatchEvent(new CustomEvent('auth:token-expired'))
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Make API request with automatic token injection and refresh
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options
    if (DEMO_MODE) {
      throw new ApiException('Backend API disabled in demo mode.', 503)
    }

    // Build full URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`

    // Prepare headers
    const headers = new Headers(fetchOptions.headers)
    
    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    // Add auth token if not skipped
    if (!skipAuth) {
      const token = this.getAccessToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    // Make request
    let response: Response
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      })
    } catch (error) {
      throw handleApiError(error)
    }

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const refreshed = await this.refreshAccessToken()
      
      if (refreshed) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        })
      } else {
        // Refresh failed, throw error
        throw new ApiException('Authentication failed. Please log in again.', 401)
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      
      try {
        const errorData = await response.json()
        
        // Handle custom error format from HttpExceptionFilter: { success: false, error: { message: ... } }
        if (errorData.error && errorData.error.message) {
          errorMessage = Array.isArray(errorData.error.message) 
            ? errorData.error.message[0] 
            : errorData.error.message
        }
        // Handle standard NestJS error format: { message: ... }
        else if (errorData.message) {
          errorMessage = Array.isArray(errorData.message) 
            ? errorData.message[0] 
            : errorData.message
        }
        // Fallback to error field
        else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : String(errorData.error)
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      throw new ApiException(errorMessage, response.status)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null as T
    }

    // Parse JSON response
    try {
      return (await response.json()) as T
    } catch (error) {
      throw new ApiException('Invalid JSON response', response.status, error)
    }
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Set tokens (used after login)
   */
  setTokens(accessToken: string, refreshToken: string, user?: AuthResponse['user']): void {
    this.storeTokens(accessToken, refreshToken, user)
  }

  /**
   * Clear tokens (used on logout)
   */
  clearAuth(): void {
    this.clearTokens()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export error utilities
export { getErrorMessage, handleApiError, ApiException }

