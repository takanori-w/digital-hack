/**
 * API Client with CSRF protection (Synchronizer Token Pattern)
 *
 * This module provides a type-safe API client that automatically handles
 * CSRF tokens for state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * Implementation: Synchronizer Token Pattern
 * - Token is fetched from /api/csrf-token endpoint
 * - Token is cached in memory and refreshed as needed
 * - httpOnly cookie remains for server-side validation
 * - Client sends token in X-CSRF-Token header
 */

const CSRF_TOKEN_HEADER = 'X-CSRF-Token'

// Token cache for Synchronizer Token Pattern
let cachedCsrfToken: string | null = null
let tokenFetchPromise: Promise<string | null> | null = null

/**
 * Fetch CSRF token from API endpoint (Synchronizer Token Pattern)
 * Uses memoization to avoid redundant requests
 */
async function fetchCsrfToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedCsrfToken) {
    return cachedCsrfToken
  }

  // Return existing promise if fetch is in progress
  if (tokenFetchPromise) {
    return tokenFetchPromise
  }

  // Server-side rendering check
  if (typeof window === 'undefined') {
    return null
  }

  // Fetch token from API endpoint
  tokenFetchPromise = fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      return response.json()
    })
    .then((data) => {
      cachedCsrfToken = data.csrfToken
      return cachedCsrfToken
    })
    .catch((error) => {
      console.error('CSRF token fetch error:', error)
      return null
    })
    .finally(() => {
      tokenFetchPromise = null
    })

  return tokenFetchPromise
}

/**
 * Clear cached CSRF token (call on logout or when token is invalidated)
 */
export function clearCsrfToken(): void {
  cachedCsrfToken = null
}

/**
 * Pre-fetch CSRF token (call on app initialization)
 */
export async function initializeCsrfToken(): Promise<void> {
  await fetchCsrfToken()
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiClientConfig {
  baseUrl: string
  defaultHeaders?: Record<string, string>
}

class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl
    this.defaultHeaders = config.defaultHeaders || {}
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers: customHeaders, ...restOptions } = options

    const url = this.buildUrl(path, params)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...(customHeaders as Record<string, string>),
    }

    // Add CSRF token for state-changing requests (Synchronizer Token Pattern)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = await fetchCsrfToken()
      if (csrfToken) {
        headers[CSRF_TOKEN_HEADER] = csrfToken
      }
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
      ...restOptions,
    }

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, errorData.message || response.statusText, errorData)
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options)
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, data, options)
  }

  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, data, options)
  }

  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, data, options)
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options)
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isServerError(): boolean {
    return this.status >= 500
  }
}

// Create and export default API client instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  defaultHeaders: {
    'Accept': 'application/json',
  },
})

export default apiClient
