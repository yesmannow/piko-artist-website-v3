/**
 * Rate limiting module
 * In production, should use Redis or similar distributed cache
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory storage (replace with Redis in production)
const rateLimitMap = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

/**
 * Check if request should be rate limited
 * @param identifier - Usually IP address
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // No record or window expired - allow and create new record
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Exceeded limit - deny
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Within limit - increment and allow
  record.count++;
  return true;
}

/**
 * Get client identifier from request headers
 * @param headers - Request headers
 * @returns IP address or "unknown"
 */
export function getClientIdentifier(headers: Headers): string {
  return headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
}

/**
 * Clear all rate limit records (useful for testing)
 */
export function clearRateLimits(): void {
  rateLimitMap.clear();
}
