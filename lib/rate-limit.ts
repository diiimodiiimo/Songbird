/**
 * Rate Limiting System
 * 
 * Implements sliding window rate limiting algorithm
 * Uses in-memory Map storage (can be upgraded to Redis for multi-instance deployments)
 * 
 * Rate limit types:
 * - AUTH: 10 requests/minute (authentication endpoints)
 * - READ: 100 requests/minute (GET requests)
 * - WRITE: 30 requests/minute (POST, PUT, DELETE)
 * - SEARCH: 20 requests/minute (search endpoints)
 */

interface RateLimitResult {
  allowed: boolean
  response?: Response
  remaining?: number
  reset?: number
}

interface RateLimitWindow {
  requests: number[]
  limit: number
  windowMs: number
}

// In-memory storage: Map<userId, Map<limitType, RateLimitWindow>>
const rateLimitStore = new Map<string, Map<string, RateLimitWindow>>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [userId, limits] of Array.from(rateLimitStore.entries())) {
    for (const [type, window] of Array.from(limits.entries())) {
      // Remove requests older than the window
      window.requests = window.requests.filter((timestamp: number) => now - timestamp < window.windowMs)
      
      // If no recent requests, remove the window
      if (window.requests.length === 0) {
        limits.delete(type)
      }
    }
    
    // If no limits for this user, remove the user
    if (limits.size === 0) {
      rateLimitStore.delete(userId)
    }
  }
}, 5 * 60 * 1000) // 5 minutes

const RATE_LIMITS = {
  AUTH: { limit: 10, windowMs: 60 * 1000 },      // 10 per minute
  READ: { limit: 100, windowMs: 60 * 1000 },    // 100 per minute
  WRITE: { limit: 30, windowMs: 60 * 1000 },    // 30 per minute
  SEARCH: { limit: 20, windowMs: 60 * 1000 },   // 20 per minute
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

/**
 * Check if a request should be rate limited
 * @param userId - Clerk user ID (or 'anonymous' for unauthenticated)
 * @param limitType - Type of rate limit to check
 * @returns RateLimitResult with allowed status and optional response
 */
export async function checkRateLimit(
  userId: string | null,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  // Use 'anonymous' for unauthenticated users
  const key = userId || 'anonymous'
  const config = RATE_LIMITS[limitType]
  const now = Date.now()

  // Get or create user's rate limit map
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, new Map())
  }
  const userLimits = rateLimitStore.get(key)!

  // Get or create window for this limit type
  if (!userLimits.has(limitType)) {
    userLimits.set(limitType, {
      requests: [],
      limit: config.limit,
      windowMs: config.windowMs,
    })
  }
  const window = userLimits.get(limitType)!

  // Remove requests outside the window
  window.requests = window.requests.filter(timestamp => now - timestamp < window.windowMs)

  // Check if limit exceeded
  if (window.requests.length >= window.limit) {
    // Calculate reset time (oldest request + window)
    const oldestRequest = Math.min(...window.requests)
    const resetTime = oldestRequest + window.windowMs
    const retryAfter = Math.ceil((resetTime - now) / 1000)

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(window.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'Retry-After': String(retryAfter),
          },
        }
      ),
      remaining: 0,
      reset: resetTime,
    }
  }

  // Add current request
  window.requests.push(now)

  // Calculate remaining requests
  const remaining = window.limit - window.requests.length
  const resetTime = now + window.windowMs

  return {
    allowed: true,
    remaining,
    reset: resetTime,
  }
}

/**
 * Get rate limit headers for a successful request
 * Optimized version that avoids expensive filtering operations
 * @param userId - Clerk user ID
 * @param limitType - Type of rate limit
 * @returns Headers object with rate limit information
 */
export async function getRateLimitHeaders(
  userId: string | null,
  limitType: RateLimitType
): Promise<Record<string, string>> {
  // Return lightweight headers without expensive filtering
  // The rate limit check already happened, so we just return static headers
  // This avoids blocking operations on every response
  const config = RATE_LIMITS[limitType]
  const now = Date.now()
  
  return {
    'X-RateLimit-Limit': String(config.limit),
    'X-RateLimit-Remaining': String(config.limit - 1), // Approximate, avoids filtering
    'X-RateLimit-Reset': String(Math.ceil((now + config.windowMs) / 1000)),
  }
}


