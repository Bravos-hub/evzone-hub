/**
 * Authentication Service
 * Handles authentication-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenRequest } from '@/core/api/types'

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/register', data, { skipAuth: true })
    const actualResponse = response.data || response;

    if (actualResponse.accessToken && actualResponse.refreshToken) {
      apiClient.setTokens(actualResponse.accessToken, actualResponse.refreshToken, actualResponse.user)
    }
    return actualResponse as AuthResponse
  },

  /**
   * Login with email/phone and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', data, { skipAuth: true })
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse

    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }
    return response
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
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
    return apiClient.post('/auth/otp/send', data, { skipAuth: true })
  },

  /**
   * Verify OTP
   */
  async verifyOtp(data: { email?: string; phone?: string; code: string; type: string }): Promise<AuthResponse> {
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
    // Backend wraps response in { success: true, data: ... }
    const wrappedResponse = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/social/apple', { token }, { skipAuth: true })

    // Extract the actual response from the wrapped structure
    const response = wrappedResponse.data || wrappedResponse as unknown as AuthResponse

    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken, response.user)
    }

    return response
  },

  /**
   * Reset password
   * Supports both token-based (from reset link) and OTP-based (from OTP verification) resets
   */
  async resetPassword(data: {
    token?: string
    email?: string
    phone?: string
    otp?: string
    newPassword: string
    confirmPassword: string
  }): Promise<{ message: string }> {
    return apiClient.post('/auth/password/reset', data, { skipAuth: true })
  },

  /**
   * Verify email with token
   */
  async verifyEmail(data: { token: string }): Promise<{ userId: string; email: string }> {
    return apiClient.post('/auth/verify-email', data, { skipAuth: true })
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(data: { email: string }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/resend-verification-email', data, { skipAuth: true })
  },
}

