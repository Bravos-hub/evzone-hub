/**
 * API Error Handling
 * Centralized error handling utilities
 */

import type { ApiError } from './types'

export class ApiException extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export function handleApiError(error: unknown): ApiException {
  if (error instanceof ApiException) {
    return error
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return new ApiException('Network error. Please check your connection.', 0, error)
    }

    // Try to parse as API error
    try {
      const apiError = JSON.parse(error.message) as ApiError
      return new ApiException(apiError.message || 'An error occurred', apiError.statusCode || 500, error)
    } catch {
      return new ApiException(error.message || 'An unexpected error occurred', 500, error)
    }
  }

  return new ApiException('An unexpected error occurred', 500, error)
}

export function getErrorMessage(error: unknown): string {
  const apiError = handleApiError(error)
  
  // Ensure message is a string
  const message = typeof apiError.message === 'string' ? apiError.message : String(apiError.message || '')
  
  // For 401 errors, check if it's a login/credential error or session expiry
  if (apiError.statusCode === 401) {
    // If the message contains "credentials" or "Invalid", it's likely a login error
    // Show the actual backend message instead of generic session expired
    if (message && 
        (message.toLowerCase().includes('credentials') || 
         message.toLowerCase().includes('invalid'))) {
      return message
    }
    // Otherwise, it's likely a session expiry
    return 'Your session has expired. Please log in again.'
  }
  
  // For other errors, prefer the actual error message from the backend
  // Only use generic messages if we don't have a specific one
  if (message && 
      message !== `Request failed with status ${apiError.statusCode}`) {
    return message
  }
  
  // User-friendly error messages based on status code (fallback)
  switch (apiError.statusCode) {
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'A conflict occurred. The resource may already exist.'
    case 422:
      return 'Invalid data provided. Please check your input.'
    case 500:
      return 'A server error occurred. Please try again later.'
    case 0:
      return 'Network error. Please check your connection.'
    default:
      return message || 'An unexpected error occurred'
  }
}

