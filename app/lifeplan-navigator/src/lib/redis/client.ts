/**
 * Redis Client Configuration
 *
 * Security Compliance:
 * - SEC-011: Secure session storage with Redis
 * - COD-005: Server-side session management
 *
 * Features:
 * - Connection pooling with automatic reconnection
 * - TLS support for production
 * - Health check functionality
 */

import Redis, { RedisOptions } from 'ioredis';

// Redis configuration from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PREFIX = 'lifeplan:';

// Parse Redis URL and build options
function buildRedisOptions(): RedisOptions {
  const url = new URL(REDIS_URL);

  const options: RedisOptions = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 6379,
    password: url.password || undefined,
    db: parseInt(url.pathname?.slice(1) || '0', 10),
    keyPrefix: REDIS_PREFIX,

    // Connection options
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,

    // Reconnection strategy
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('[Redis] Max reconnection attempts reached');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },

    // Event logging
    lazyConnect: true,
  };

  // Enable TLS in production
  if (process.env.NODE_ENV === 'production' && url.protocol === 'rediss:') {
    options.tls = {
      rejectUnauthorized: true,
    };
  }

  return options;
}

// Singleton Redis client
let redisClient: Redis | null = null;
let isConnecting = false;

/**
 * Get or create Redis client instance
 */
export async function getRedisClient(): Promise<Redis> {
  if (redisClient?.status === 'ready') {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getRedisClient();
  }

  isConnecting = true;

  try {
    redisClient = new Redis(buildRedisOptions());

    // Event handlers
    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    // Connect
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const client = await getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed gracefully');
  }
}

// Export prefix for use in other modules
export { REDIS_PREFIX };
