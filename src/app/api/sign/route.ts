import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { token, signedName, signatureData } = await req.json()
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

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

  if (!quote || quote.status === 'signed') {
    return NextResponse.json({ error: 'Invalid or already signed' }, { status: 400 })
  }

  // Store signature as data URL in storage or directly
  const { error } = await supabase.from('quotes').update({
    status: 'signed',
    signed_at: new Date().toISOString(),
    signed_name: signedName,
    signed_ip: ip,
    signature_url: signatureData,
  }).eq('id', quote.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
