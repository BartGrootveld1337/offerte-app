import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/pdf/QuotePDF'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  // Ownership already enforced by .eq('user_id', user.id) above
  if (quote.user_id !== user.id) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(createElement(QuotePDF, { quote, profile }) as any).toBlob()
    const arrayBuffer = await blob.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="offerte-${quote.quote_number}.pdf"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[pdf generation]', error)
    return NextResponse.json({ error: 'PDF genereren mislukt' }, { status: 500 })
  }
}
