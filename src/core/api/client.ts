/**
 * API Client
 * Cookie-based authentication with automatic refresh
 */

import { API_CONFIG } from './config';
import { ApiException, handleApiError, getErrorMessage } from './errors';
import type { AuthResponse } from './types';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  params?: Record<string, any>;
  responseType?: 'json' | 'blob' | 'text';
};

class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<AuthResponse | null> | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.loadTokensFromStorage();
  }

  /**
   * Load tokens from localStorage on initialization
   */
  private loadTokensFromStorage() {
    try {
      const accessToken = localStorage.getItem('evzone:access_token');
      const refreshToken = localStorage.getItem('evzone:refresh_token');
      if (accessToken && refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  /**
   * Store tokens and persist to localStorage
   */
  setTokens(accessToken: string, refreshToken: string, _user?: unknown) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    try {
      localStorage.setItem('evzone:access_token', accessToken);
      localStorage.setItem('evzone:refresh_token', refreshToken);
    } catch (error) {
      console.error('Failed to persist tokens to storage:', error);
    }
  }

  /**
   * Clear any locally stored auth state.
   */
  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('evzone:access_token');
      localStorage.removeItem('evzone:refresh_token');
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }

  /**
   * Refresh access token using stored refresh token
   */
  private async refreshAccessToken(): Promise<AuthResponse | null> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Send refresh token in request body (fallback to cookie if available)
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Send cookies if available
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        });

        if (!response.ok) {
          throw new ApiException('Token refresh failed', response.status);
        }

        const data = (await response.json()) as AuthResponse;

        // Update stored tokens with new ones
        if (data.accessToken && data.refreshToken) {
          this.setTokens(data.accessToken, data.refreshToken);
        }

        return data;
      } catch (error) {
        // Refresh failed, dispatch event for auth store
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make API request with automatic cookie handling
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, skipRefresh = false, params, responseType = 'json', ...fetchOptions } = options;

    // Build full URL
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    // Append query params if present
    if (params) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          qs.append(key, String(value));
        }
      });
      const queryString = qs.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Prepare headers
    const headers = new Headers(fetchOptions.headers);

    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Add Authorization header if we have an access token
    if (!skipAuth && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    // Make request with credentials (cookies)
    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // IMPORTANT: Send cookies
      });
    } catch (error) {
      throw handleApiError(error);
    }

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        // Retry request (new cookie will be sent automatically)
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      } else {
        // Refresh failed, throw error
        throw new ApiException('Authentication failed. Please log in again.', 401);
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();

        if (errorData.error && errorData.error.message) {
          errorMessage = Array.isArray(errorData.error.message)
            ? errorData.error.message[0]
            : errorData.error.message;
        } else if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : String(errorData.error);
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiException(errorMessage, response.status);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    // Parse response
    try {
      if (responseType === 'blob') {
        return (await response.blob()) as unknown as T
      }
      if (responseType === 'text') {
        return (await response.text()) as unknown as T
      }
      return (await response.json()) as T;
    } catch (error) {
      throw new ApiException('Invalid response format', response.status, error);
    }
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  patch<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export error utilities
export { getErrorMessage, handleApiError, ApiException };
