import { createServerClient } from '@supabase/ssr'
import { createHash } from 'crypto'
import { rateLimit } from './rate-limit'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function authenticateApiKey(
  authHeader: string | null,
  ip = 'unknown'
): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  // Rate limit: max 60 auth attempts per IP per minute (defense against brute-force)
  if (!rateLimit(`api-auth:${ip}`, 60, 60_000)) {
    return null
  }

  const key = authHeader.replace('Bearer ', '').trim()
  const keyHash = hashApiKey(key)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('user_id, id')
    .eq('key_hash', keyHash)
    .single()

  if (!apiKey) return null

  // Update last used
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id)

  return { userId: apiKey.user_id }
}
