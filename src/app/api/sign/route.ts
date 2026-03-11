import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: max 30 sign attempts per IP per 15 minutes
  if (!rateLimit(getIp(req), 30, 900_000)) {
    return NextResponse.json({ error: 'Te veel verzoeken. Probeer later opnieuw.' }, { status: 429 })
  }

  const { token, signedName, signatureData, action, declinedReason } = await req.json()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'

  // Signature size check: max 500KB (500_000 chars)
  if (signatureData && typeof signatureData === 'string' && signatureData.length > 500_000) {
    return NextResponse.json({ error: 'Handtekening te groot' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('sign_token', token)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  if (quote.status === 'signed' || quote.status === 'declined') {
    return NextResponse.json({ error: 'Offerte is al verwerkt' }, { status: 400 })
  }

  if (action === 'decline') {
    const { error } = await supabase.from('quotes').update({
      status: 'declined',
      declined_reason: declinedReason || null,
    }).eq('id', quote.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log event
    await supabase.from('quote_events').insert({
      quote_id: quote.id,
      event_type: 'declined',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || '',
    })

    return NextResponse.json({ success: true, action: 'declined' })
  }

  // Default: sign
  if (!signedName) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
  }

  const { error } = await supabase.from('quotes').update({
    status: 'signed',
    signed_at: new Date().toISOString(),
    signed_name: signedName,
    signed_ip: ip,
    signature_url: signatureData,
  }).eq('id', quote.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log event
  await supabase.from('quote_events').insert({
    quote_id: quote.id,
    event_type: 'signed',
    ip_address: ip,
    user_agent: req.headers.get('user-agent') || '',
  })

  return NextResponse.json({ success: true, action: 'signed' })
}
