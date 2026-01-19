/**
 * API Configuration
 * Centralized configuration for API client
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 1,
} as const

// Default to demo mode in development if not explicitly set
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const TOKEN_STORAGE_KEYS = {
  accessToken: 'evzone:accessToken',
  refreshToken: 'evzone:refreshToken',
  user: 'evzone:user',
} as const

