// Simple in-memory rate limiter (resets on server restart, good enough for serverless edge)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()

// Cleanup expired entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, record] of ipRequestCounts.entries()) {
    if (now > record.resetAt) {
      ipRequestCounts.delete(key)
    }
  }
}

export function rateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  maybeCleanup()
  const now = Date.now()
  const record = ipRequestCounts.get(ip)

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (record.count >= maxRequests) {
    return false // rate limited
  }

  record.count++
  return true // allowed
}

export function getIp(req: { headers: { get: (h: string) => string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
