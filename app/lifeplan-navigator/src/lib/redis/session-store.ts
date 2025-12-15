/**
 * Redis Session Store for NextAuth.js
 *
 * Security Compliance:
 * - SEC-011: Server-side session storage
 * - COD-005: Secure session management
 * - CISO Design: Session isolation and TTL management
 *
 * Features:
 * - Server-side session storage (not JWT only)
 * - Automatic session expiration
 * - Session activity tracking
 * - Concurrent session limiting
 */

import { getRedisClient, REDIS_PREFIX } from './client';
import { SESSION_POLICY } from '@/lib/auth/config';

// Session data interface
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

// Redis key patterns
const SESSION_KEY = (sessionId: string) => `session:${sessionId}`;
const USER_SESSIONS_KEY = (userId: string) => `user_sessions:${userId}`;
const SESSION_ACTIVITY_KEY = (sessionId: string) => `session_activity:${sessionId}`;

/**
 * Redis Session Store
 */
export class RedisSessionStore {
  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    data: Omit<SessionData, 'createdAt' | 'lastActivity' | 'expiresAt'>
  ): Promise<SessionData> {
    const redis = await getRedisClient();
    const now = Date.now();
    const expiresAt = now + SESSION_POLICY.absoluteTimeout * 1000;

    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      lastActivity: now,
      expiresAt,
    };

    // Store session data
    await redis.setex(
      SESSION_KEY(sessionId),
      SESSION_POLICY.absoluteTimeout,
      JSON.stringify(sessionData)
    );

    // Add to user's session list for concurrent session tracking
    await redis.sadd(USER_SESSIONS_KEY(data.userId), sessionId);
    await redis.expire(USER_SESSIONS_KEY(data.userId), SESSION_POLICY.absoluteTimeout);

    // Enforce concurrent session limit
    await this.enforceSessionLimit(data.userId);

    console.log(`[Session] Created session ${sessionId} for user ${data.userId}`);

    return sessionData;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const redis = await getRedisClient();
    const data = await redis.get(SESSION_KEY(sessionId));

    if (!data) {
      return null;
    }

    const session: SessionData = JSON.parse(data);

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity (extends idle timeout)
   */
  async touchSession(sessionId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    const now = Date.now();

    // Check idle timeout
    const idleTime = now - session.lastActivity;
    if (idleTime > SESSION_POLICY.idleTimeout * 1000) {
      console.log(`[Session] Session ${sessionId} expired due to idle timeout`);
      await this.destroySession(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = now;

    // Calculate remaining TTL
    const remainingTTL = Math.floor((session.expiresAt - now) / 1000);

    if (remainingTTL > 0) {
      await redis.setex(SESSION_KEY(sessionId), remainingTTL, JSON.stringify(session));
      return true;
    }

    return false;
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<SessionData | null> {
    const redis = await getRedisClient();
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };

    // Calculate remaining TTL
    const remainingTTL = Math.floor((session.expiresAt - Date.now()) / 1000);

    if (remainingTTL > 0) {
      await redis.setex(SESSION_KEY(sessionId), remainingTTL, JSON.stringify(updatedSession));
      return updatedSession;
    }

    return null;
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    const session = await this.getSession(sessionId);

    // Remove session data
    await redis.del(SESSION_KEY(sessionId));
    await redis.del(SESSION_ACTIVITY_KEY(sessionId));

    // Remove from user's session list
    if (session?.userId) {
      await redis.srem(USER_SESSIONS_KEY(session.userId), sessionId);
    }

    console.log(`[Session] Destroyed session ${sessionId}`);
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyAllUserSessions(userId: string): Promise<number> {
    const redis = await getRedisClient();
    const sessionIds = await redis.smembers(USER_SESSIONS_KEY(userId));

    for (const sessionId of sessionIds) {
      await redis.del(SESSION_KEY(sessionId));
      await redis.del(SESSION_ACTIVITY_KEY(sessionId));
    }

    await redis.del(USER_SESSIONS_KEY(userId));

    console.log(`[Session] Destroyed ${sessionIds.length} sessions for user ${userId}`);

    return sessionIds.length;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const redis = await getRedisClient();
    const sessionIds = await redis.smembers(USER_SESSIONS_KEY(userId));
    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length > SESSION_POLICY.maxConcurrentSessions) {
      // Sort by creation time (oldest first)
      sessions.sort((a, b) => a.createdAt - b.createdAt);

      // Remove oldest sessions until within limit
      const sessionsToRemove = sessions.length - SESSION_POLICY.maxConcurrentSessions;

      for (let i = 0; i < sessionsToRemove; i++) {
        const redis = await getRedisClient();
        const sessionKeys = await redis.smembers(USER_SESSIONS_KEY(userId));

        // Find the session to remove
        for (const sessionId of sessionKeys) {
          const sessionData = await redis.get(SESSION_KEY(sessionId));
          if (sessionData) {
            const session: SessionData = JSON.parse(sessionData);
            if (session.createdAt === sessions[i].createdAt) {
              await this.destroySession(sessionId);
              console.log(
                `[Session] Removed oldest session ${sessionId} for user ${userId} (concurrent limit)`
              );
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Verify MFA for session
   */
  async setMfaVerified(sessionId: string, verified: boolean): Promise<boolean> {
    const session = await this.updateSession(sessionId, { mfaVerified: verified });
    return session !== null;
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
  }> {
    const redis = await getRedisClient();
    // Note: This is a simplified implementation
    // In production, consider using SCAN for large datasets
    const keys = await redis.keys(`${REDIS_PREFIX}session:*`);

    return {
      totalSessions: keys.length,
      activeSessions: keys.length, // All stored sessions are active
    };
  }
}

// Singleton instance
let sessionStoreInstance: RedisSessionStore | null = null;

export function getSessionStore(): RedisSessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new RedisSessionStore();
  }
  return sessionStoreInstance;
}

export const sessionStore = getSessionStore();
