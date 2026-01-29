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
};

class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<AuthResponse | null> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  /**
   * Refresh access token using cookie-based refresh token
   */
  private async refreshAccessToken(): Promise<AuthResponse | null> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Send cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new ApiException('Token refresh failed', response.status);
        }

        const data = (await response.json()) as AuthResponse;
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
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

    // Build full URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    // Prepare headers
    const headers = new Headers(fetchOptions.headers);

    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
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

    // Parse JSON response
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new ApiException('Invalid JSON response', response.status, error);
    }
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export error utilities
export { getErrorMessage, handleApiError, ApiException };
