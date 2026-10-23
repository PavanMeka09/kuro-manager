type RateLimitRecord = {
  tokens: number;
  lastRefill: number;
};

const store = new Map<string, RateLimitRecord>();

/**
 * Token Bucket Rate Limiter
 * @param key unique identifier (e.g. client IP or registration number)
 * @param capacity maximum tokens allowed in bucket
 * @param refillRateTokensPerSec tokens added per second
 */
export function checkRateLimit(
  key: string,
  capacity = 60,
  refillRateTokensPerSec = 1
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(key) || {
    tokens: capacity,
    lastRefill: now,
  };

  // Refill tokens based on elapsed time
  const elapsedSec = (now - record.lastRefill) / 1000;
  record.tokens = Math.min(capacity, record.tokens + elapsedSec * refillRateTokensPerSec);
  record.lastRefill = now;

  if (record.tokens >= 1) {
    record.tokens -= 1;
    store.set(key, record);
    return {
      allowed: true,
      remaining: Math.floor(record.tokens),
    };
  }

  store.set(key, record);
  return {
    allowed: false,
    remaining: 0,
  };
}

// Clean up old entries periodically to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.lastRefill > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
