'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initializeCsrfToken } from '@/lib/api-client'

const CSRF_TOKEN_HEADER = 'X-CSRF-Token'

interface CsrfContextValue {
  csrfToken: string | null
  getCsrfHeaders: () => Record<string, string>
  refreshToken: () => Promise<void>
}

const CsrfContext = createContext<CsrfContextValue | null>(null)

/**
 * CSRF Token Provider
 *
 * Provides CSRF token via context for Synchronizer Token Pattern.
 * This ensures the token is fetched and cached before any state-changing
 * requests are made.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCsrfToken(data.csrfToken)
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
    }
  }, [])

  useEffect(() => {
    // Pre-fetch CSRF token on app initialization
    fetchToken()
    // Also initialize the global cache
    initializeCsrfToken().catch((error) => {
      console.error('Failed to initialize CSRF token:', error)
    })
  }, [fetchToken])

  const getCsrfHeaders = useCallback((): Record<string, string> => {
    if (csrfToken) {
      return { [CSRF_TOKEN_HEADER]: csrfToken }
    }
    return {}
  }, [csrfToken])

  const refreshToken = useCallback(async () => {
    await fetchToken()
  }, [fetchToken])

  return (
    <CsrfContext.Provider value={{ csrfToken, getCsrfHeaders, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  )
}

/**
 * Hook to access CSRF token and helpers
 */
export function useCsrf(): CsrfContextValue {
  const context = useContext(CsrfContext)
  if (!context) {
    throw new Error('useCsrf must be used within a CsrfProvider')
  }
  return context
}
