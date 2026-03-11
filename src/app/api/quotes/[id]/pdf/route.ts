import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { formatCurrency, formatDate } from '@/lib/utils'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// We use a custom HTML-to-PDF approach via jsPDF since react-pdf has SSR limitations
// This renders a clean HTML string that's returned as a downloadable HTML file
// For a proper PDF, use the print dialog or a headless browser
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()

  // Auth check: use anon key to verify session
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  // Use service role client for data fetching
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  // Ownership check
  if (quote.user_id !== user.id) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', quote.user_id)
    .single()

  const items = quote.quote_items || []

  const itemRows = items
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((item: { description: string; quantity: number; unit: string; unit_price: number; vat_rate: number; line_total: number }) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#1e293b;">${escapeHtml(String(item.description || ''))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${item.quantity} ${escapeHtml(String(item.unit || ''))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${item.vat_rate}%</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#1e293b;">${formatCurrency(item.line_total)}</td>
      </tr>
    `).join('')

  // Escape all user-derived data fields
  const eTitle = escapeHtml(String(quote.title || ''))
  const eQuoteNumber = escapeHtml(String(quote.quote_number || ''))
  const eIntro = escapeHtml(String(quote.intro || ''))
  const eFooter = escapeHtml(String(quote.footer || ''))
  const eSignedName = escapeHtml(String(quote.signed_name || ''))

  const eCompanyName = escapeHtml(String(profile?.company_name || ''))
  const eCompanyAddress = escapeHtml(String(profile?.company_address || ''))
  const eCompanyCity = escapeHtml(String(profile?.company_city || ''))
  const eCompanyPostal = escapeHtml(String(profile?.company_postal || ''))
  const eCompanyEmail = escapeHtml(String(profile?.company_email || ''))
  const eCompanyPhone = escapeHtml(String(profile?.company_phone || ''))
  const eCompanyKvk = escapeHtml(String(profile?.company_kvk || ''))
  const eCompanyBtw = escapeHtml(String(profile?.company_btw || ''))

  const eClientCompany = quote.clients ? escapeHtml(String(quote.clients.company || '')) : ''
  const eClientName = quote.clients ? escapeHtml(String(quote.clients.name || '')) : ''
  const eClientEmail = quote.clients ? escapeHtml(String(quote.clients.email || '')) : ''
  const eClientAddress = quote.clients ? escapeHtml(String(quote.clients.address || '')) : ''
  const eClientPostal = quote.clients ? escapeHtml(String(quote.clients.postal || '')) : ''
  const eClientCity = quote.clients ? escapeHtml(String(quote.clients.city || '')) : ''

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offerte ${eQuoteNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { background: #0f172a; color: white; padding: 40px; border-radius: 12px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 28px; font-weight: 800; }
    .header .number { font-family: monospace; color: #94a3b8; margin-top: 4px; }
    .header .total { text-align: right; }
    .header .total-amount { font-size: 32px; font-weight: 800; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; padding: 24px; background: #f8fafc; border-radius: 12px; }
    .party-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
    .party-name { font-weight: 700; font-size: 16px; }
    .party-info { color: #64748b; font-size: 14px; line-height: 1.6; }
    .dates { display: flex; gap: 24px; margin-bottom: 24px; font-size: 14px; color: #64748b; }
    .dates strong { color: #1e293b; }
    .intro { color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 32px; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f1f5f9; }
    th { padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b; }
    th:not(:first-child) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(4) { text-align: center; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #64748b; }
    .totals-row.total { font-size: 18px; font-weight: 800; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 4px; }
    .footer-text { color: #64748b; font-size: 13px; line-height: 1.7; white-space: pre-wrap; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px; }
    .signature-section { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
    .signature-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
    .signature-img { max-height: 80px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1>${eTitle}</h1>
      <div class="number">${eQuoteNumber}</div>
    </div>
    <div class="total">
      <div class="total-amount">${formatCurrency(quote.total)}</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:4px;">incl. BTW</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Van</div>
      <div class="party-name">${eCompanyName}</div>
      <div class="party-info">
        ${profile?.company_address ? `${eCompanyAddress}<br>` : ''}
        ${eCompanyPostal} ${eCompanyCity}<br>
        ${profile?.company_email ? `${eCompanyEmail}<br>` : ''}
        ${profile?.company_phone ? `${eCompanyPhone}<br>` : ''}
        ${profile?.company_kvk ? `KvK: ${eCompanyKvk}<br>` : ''}
        ${profile?.company_btw ? `BTW: ${eCompanyBtw}` : ''}
      </div>
    </div>
    ${quote.clients ? `
    <div>
      <div class="party-label">Aan</div>
      ${quote.clients.company ? `<div class="party-name">${eClientCompany}</div>` : ''}
      <div class="party-info">
        ${eClientName}<br>
        ${eClientEmail}<br>
        ${quote.clients.address ? `${eClientAddress}<br>` : ''}
        ${eClientPostal} ${eClientCity}
      </div>
    </div>` : ''}
  </div>

  <div class="dates">
    <span><strong>Datum:</strong> ${formatDate(quote.created_at)}</span>
    ${quote.valid_until ? `<span><strong>Geldig tot:</strong> ${formatDate(quote.valid_until)}</span>` : ''}
  </div>

  ${quote.intro ? `<div class="intro">${eIntro}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th style="text-align:center;">Aantal</th>
        <th style="text-align:right;">Prijs</th>
        <th style="text-align:center;">BTW</th>
        <th style="text-align:right;">Totaal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotaal (excl. BTW)</span><span>${formatCurrency(quote.subtotal)}</span></div>
    ${(quote.discount_percent || quote.discount_amount) ? `<div class="totals-row" style="color:#dc2626;"><span>Korting</span><span>-${formatCurrency((quote.discount_percent || 0) > 0 ? quote.subtotal * (quote.discount_percent || 0) / 100 : (quote.discount_amount || 0))}</span></div>` : ''}
    <div class="totals-row"><span>BTW</span><span>${formatCurrency(quote.vat_amount)}</span></div>
    <div class="totals-row total"><span>Totaal</span><span>${formatCurrency(quote.total)}</span></div>
  </div>

  ${quote.footer ? `<div class="footer-text">${eFooter}</div>` : ''}

  ${quote.signed_at ? `
  <div class="signature-section">
    <div class="signature-label">Digitale handtekening</div>
    ${quote.signature_url ? `<img src="${quote.signature_url}" alt="Handtekening" class="signature-img">` : ''}
    <p style="font-size:13px;color:#64748b;margin-top:8px;">Ondertekend door <strong>${eSignedName}</strong> op ${formatDate(quote.signed_at)}</p>
  </div>` : ''}
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="offerte-${eQuoteNumber}.html"`,
    },
  })
}
