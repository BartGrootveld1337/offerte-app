import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { quoteId, eventType } = await req.json()
  if (!quoteId || !eventType) {
    return NextResponse.json({ error: 'quoteId en eventType zijn verplicht' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || ''

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  await supabase.from('quote_events').insert({
    quote_id: quoteId,
    event_type: eventType,
    ip_address: ip,
    user_agent: userAgent,
  })

  return NextResponse.json({ success: true })
}
