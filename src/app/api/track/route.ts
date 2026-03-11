import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ALLOWED_EVENT_TYPES = ['opened', 'signed', 'declined'] as const
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const { quoteId, eventType } = await req.json()

  if (!quoteId || !eventType) {
    return NextResponse.json({ error: 'quoteId en eventType zijn verplicht' }, { status: 400 })
  }

  // Validate event type
  if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: 'Ongeldig event type' }, { status: 400 })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(quoteId)) {
    return NextResponse.json({ error: 'Ongeldig quoteId formaat' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || ''

  // Use anon key — RLS allows reading quotes with a sign_token
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Verify the quote exists and has a sign_token (is public/sent)
  const { data: quoteExists } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', quoteId)
    .not('sign_token', 'is', null)
    .single()

  if (!quoteExists) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  // Use service role for writing events
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  await supabaseAdmin.from('quote_events').insert({
    quote_id: quoteId,
    event_type: eventType,
    ip_address: ip,
    user_agent: userAgent,
  })

  return NextResponse.json({ success: true })
}
