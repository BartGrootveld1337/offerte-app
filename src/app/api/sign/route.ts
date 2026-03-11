import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { render } from '@react-email/render'
import { createElement } from 'react'
import { QuoteSignedNotificationEmail } from '@/components/emails/QuoteSignedNotificationEmail'
import { QuoteDeclinedNotificationEmail } from '@/components/emails/QuoteDeclinedNotificationEmail'
import { Resend } from 'resend'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://offerte.vrijdag.ai'

export async function POST(req: NextRequest) {
  // Rate limit: max 30 sign attempts per IP per 15 minutes
  if (!rateLimit(getIp(req), 30, 900_000)) {
    return NextResponse.json({ error: 'Te veel verzoeken. Probeer later opnieuw.' }, { status: 429 })
  }

  const { token, signedName, signatureData, action, declinedReason } = await req.json()

  // Validate token format (UUID)
  if (!token || !UUID_REGEX.test(token)) {
    return NextResponse.json({ error: 'Ongeldig token formaat' }, { status: 400 })
  }

  // Validate signedName length
  if (signedName && typeof signedName === 'string' && signedName.length > 200) {
    return NextResponse.json({ error: 'Naam te lang (max 200 tekens)' }, { status: 400 })
  }

  // Validate declinedReason length
  if (declinedReason && typeof declinedReason === 'string' && declinedReason.length > 1000) {
    return NextResponse.json({ error: 'Reden te lang (max 1000 tekens)' }, { status: 400 })
  }
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

  // CVE-003: Block signing of expired quotes
  if (quote.status === 'expired') {
    return NextResponse.json({ error: 'Deze offerte is verlopen en kan niet meer worden ondertekend' }, { status: 400 })
  }

  // CVE-003: Also check valid_until date explicitly
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return NextResponse.json({ error: 'Deze offerte is verlopen en kan niet meer worden ondertekend' }, { status: 400 })
  }

  if (action === 'decline') {
    const { error } = await supabase.from('quotes').update({
      status: 'declined',
      declined_reason: declinedReason || null,
    }).eq('id', quote.id)

    if (error) {
    console.error("[sign route]", error.message)
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 })
  }

    // Log event
    await supabase.from('quote_events').insert({
      quote_id: quote.id,
      event_type: 'declined',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || '',
    })

    // Fire-and-forget: notify quote owner of decline
    ;(async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_email, company_name')
          .eq('id', quote.user_id)
          .single()
        if (!profile?.company_email || !process.env.RESEND_API_KEY) return

        const resend = new Resend(process.env.RESEND_API_KEY)
        const dashboardUrl = `${APP_URL}/quotes/${quote.id}`

        // Format total as currency if it's a number
        const formattedTotal = typeof quote.total === 'number'
          ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(quote.total)
          : String(quote.total || '')

        const html = await render(
          createElement(QuoteDeclinedNotificationEmail, {
            clientName: String(quote.client_name || quote.client_email || ''),
            quoteNumber: String(quote.quote_number || ''),
            quoteTitle: String(quote.title || `Offerte ${quote.quote_number}`),
            total: formattedTotal,
            declinedReason: declinedReason || undefined,
            dashboardUrl,
          })
        )

        await resend.emails.send({
          from: 'Vrijdag.AI Offerte <bart@vrijdag.ai>',
          to: profile.company_email,
          subject: `Offerte ${quote.quote_number} afgewezen`,
          html,
        })
      } catch (e) {
        console.error('Notification email error (decline):', e)
      }
    })()

    return NextResponse.json({ success: true, action: 'declined' })
  }

  // Default: sign
  if (!signedName) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
  }

  const signedAt = new Date().toISOString()

  const { error } = await supabase.from('quotes').update({
    status: 'signed',
    signed_at: signedAt,
    signed_name: signedName,
    signed_ip: ip,
    signature_url: signatureData,
  }).eq('id', quote.id)

  if (error) {
    console.error("[sign route]", error.message)
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 })
  }

  // Log event
  await supabase.from('quote_events').insert({
    quote_id: quote.id,
    event_type: 'signed',
    ip_address: ip,
    user_agent: req.headers.get('user-agent') || '',
  })

  // Fire-and-forget: notify quote owner of signing
  ;(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_email, company_name')
        .eq('id', quote.user_id)
        .single()
      if (!profile?.company_email || !process.env.RESEND_API_KEY) return

      const resend = new Resend(process.env.RESEND_API_KEY)
      const dashboardUrl = `${APP_URL}/quotes/${quote.id}`

      // Format total as currency if it's a number
      const formattedTotal = typeof quote.total === 'number'
        ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(quote.total)
        : String(quote.total || '')

      // Format signed date as Dutch datetime
      const formattedSignedAt = new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(signedAt))

      const html = await render(
        createElement(QuoteSignedNotificationEmail, {
          clientName: String(quote.client_name || quote.client_email || ''),
          signedName: String(signedName),
          quoteNumber: String(quote.quote_number || ''),
          quoteTitle: String(quote.title || `Offerte ${quote.quote_number}`),
          total: formattedTotal,
          signedAt: formattedSignedAt,
          dashboardUrl,
        })
      )

      await resend.emails.send({
        from: 'Vrijdag.AI Offerte <bart@vrijdag.ai>',
        to: profile.company_email,
        subject: `✅ Offerte ${quote.quote_number} ondertekend`,
        html,
      })
    } catch (e) {
      console.error('Notification email error (signed):', e)
    }
  })()

  return NextResponse.json({ success: true, action: 'signed' })
}
