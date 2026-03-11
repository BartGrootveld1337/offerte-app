import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { render } from '@react-email/render'
import { createElement } from 'react'
import { QuoteClientEmail } from '@/components/emails/QuoteClientEmail'

export async function POST(req: NextRequest) {
  // Rate limit
  if (!rateLimit(getIp(req), 20, 3_600_000)) {
    return NextResponse.json({ error: 'Te veel verzoeken. Probeer later opnieuw.' }, { status: 429 })
  }

  // Auth
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const {
    quoteId,
    clientEmail,
    clientName,
    signUrl,
    quoteNumber,
    total,
    validUntil,
    companyName,
    companyEmail,
    companyPhone,
    companyWebsite,
  } = await req.json()

  // Validate email
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
  if (!clientEmail || !EMAIL_REGEX.test(String(clientEmail))) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
  }

  // Ownership check
  const { data: quoteRecord } = await supabase
    .from('quotes')
    .select('id, user_id')
    .eq('id', quoteId)
    .single()
  if (!quoteRecord || quoteRecord.user_id !== user.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  // Format valid until date
  const formattedValidUntil = validUntil
    ? new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(validUntil))
    : undefined

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service niet geconfigureerd' }, { status: 500 })
  }

  // Render email template
  let html: string
  try {
    html = await render(
      createElement(QuoteClientEmail, {
        clientName: String(clientName || ''),
        companyName: String(companyName || ''),
        quoteNumber: String(quoteNumber || ''),
        total: String(total || ''),
        validUntil: formattedValidUntil,
        signUrl: String(signUrl || ''),
        companyEmail: companyEmail ? String(companyEmail) : undefined,
        companyPhone: companyPhone ? String(companyPhone) : undefined,
        companyWebsite: companyWebsite ? String(companyWebsite) : undefined,
      })
    )
  } catch (renderError) {
    console.error('Email template render error:', renderError)
    return NextResponse.json({ error: 'Fout bij genereren e-mail template' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: `${String(companyName || 'Vrijdag.AI')} <offerte@vrijdag.ai>`,
      to: clientEmail,
      subject: `Offerte ${String(quoteNumber || '')} — ${String(total || '')} | ${String(companyName || '')}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Fout bij verzenden e-mail' }, { status: 500 })
  }
}
