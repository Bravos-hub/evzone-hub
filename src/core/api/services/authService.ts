/**
 * Authentication Service
 * Handles authentication-related API calls
 */

import { apiClient } from '../client'
import { DEMO_MODE, TOKEN_STORAGE_KEYS } from '../config'
import { ApiException } from '../errors'
import { DEMO_AUTH_PASSWORD, findDemoUser, type DemoAuthUser } from '@/data/mockDb/demoAuth'
import type { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenRequest } from '../types'

function buildDemoAuthResponse(user: DemoAuthUser): AuthResponse {
  return {
    accessToken: `demo-access-${user.id}`,
    refreshToken: `demo-refresh-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
}

function demoLogin(data: LoginRequest): AuthResponse {
  const user = findDemoUser(data.email, data.phone)
  if (!user || data.password !== DEMO_AUTH_PASSWORD) {
    throw new ApiException('Invalid demo credentials', 401)
  }
  const response = buildDemoAuthResponse(user)
  apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
  return response
}

function demoRefresh(): AuthResponse {
  const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)
  const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)
  const userRaw = localStorage.getItem(TOKEN_STORAGE_KEYS.user)
  if (!accessToken || !refreshToken || !userRaw) {
    throw new ApiException('Demo session expired. Please log in again.', 401)
  }
  return {
    accessToken,
    refreshToken,
    user: JSON.parse(userRaw) as AuthResponse['user'],
  }
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (DEMO_MODE) {
      throw new ApiException('Demo mode: registration is disabled.', 403)
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', data, { skipAuth: true })
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    // Store tokens after successful registration
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },

  /**
   * Login with email/phone and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    if (DEMO_MODE) {
      return demoLogin(data)
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', data, { skipAuth: true })
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    // Store tokens after successful login
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (DEMO_MODE) {
      return demoRefresh()
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/refresh',
      { refreshToken } as RefreshTokenRequest,
      { skipAuth: true }
    )
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    // Update stored tokens
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (DEMO_MODE) {
      apiClient.clearAuth()
      return
    }
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error)
    } finally {
      // Always clear local tokens
      apiClient.clearAuth()
    }
  },

  /**
   * Send OTP
   */
  async sendOtp(data: { email?: string; phone?: string; type: string }): Promise<{ message: string }> {
    if (DEMO_MODE) {
      throw new ApiException('Demo mode: OTP is disabled.', 403)
    }
    return apiClient.post('/auth/otp/send', data, { skipAuth: true })
  },

  /**
   * Verify OTP
   */
  async verifyOtp(data: { email?: string; phone?: string; code: string; type: string }): Promise<AuthResponse> {
    if (DEMO_MODE) {
      throw new ApiException('Demo mode: OTP verification is disabled.', 403)
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/otp/verify', data, { skipAuth: true })
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    // Store tokens after successful OTP verification
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },

  /**
   * Social login (Google)
   */
  async googleLogin(token: string): Promise<AuthResponse> {
    if (DEMO_MODE) {
      throw new ApiException('Demo mode: social login is disabled.', 403)
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/social/google', { token }, { skipAuth: true })
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },

  /**
   * Social login (Apple)
   */
  async appleLogin(token: string): Promise<AuthResponse> {
    if (DEMO_MODE) {
      throw new ApiException('Demo mode: social login is disabled.', 403)
    }
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/social/apple', { token }, { skipAuth: true })
    
    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse
    
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    
    return response
  },
}

