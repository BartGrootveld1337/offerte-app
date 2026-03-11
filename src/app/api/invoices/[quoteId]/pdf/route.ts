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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const { quoteId } = await params
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
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let invoice = null
  const { data: inv } = await supabase.from('invoices').select('*').eq('quote_id', quoteId).single()
  invoice = inv

  const items = quote.quote_items || []
  const itemRows = items
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((item: { description: string; quantity: number; unit: string; unit_price: number; vat_rate: number; line_total: number }) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(String(item.description || ''))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${item.quantity} ${escapeHtml(String(item.unit || ''))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${item.vat_rate}%</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(item.line_total)}</td>
      </tr>
    `).join('')

  const invoiceNumber = escapeHtml(invoice?.invoice_number || 'INV-???')
  const companyName = escapeHtml(profile?.company_name || '')
  const clientName = quote.clients ? escapeHtml(String(quote.clients.name || '')) : ''
  const clientCompany = quote.clients ? escapeHtml(String(quote.clients.company || '')) : ''

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Factuur ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { background: linear-gradient(135deg, #0c4a6e, #1e3a5f); color: white; padding: 40px; border-radius: 12px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 28px; font-weight: 800; letter-spacing: 2px; }
    .header .sub { color: #93c5fd; margin-top: 4px; font-size: 14px; }
    .total-amount { font-size: 32px; font-weight: 800; text-align: right; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; padding: 24px; background: #f8fafc; border-radius: 12px; }
    .party-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
    .party-name { font-weight: 700; font-size: 16px; }
    .party-info { color: #64748b; font-size: 14px; line-height: 1.7; }
    .dates { display: flex; gap: 24px; margin-bottom: 24px; font-size: 14px; }
    .dates strong { color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f1f5f9; }
    th { padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #64748b; }
    .totals-row.total { font-size: 18px; font-weight: 800; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 4px; }
    .payment-info { margin-top: 32px; padding: 20px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; }
    .payment-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #0284c7; margin-bottom: 8px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1>FACTUUR</h1>
      <div class="sub">${invoiceNumber}</div>
      <div class="sub" style="color:#93c5fd;margin-top:4px;">Op basis van offerte ${escapeHtml(quote.quote_number)}</div>
    </div>
    <div>
      <div class="total-amount">${formatCurrency(quote.total)}</div>
      <div style="color:#93c5fd;font-size:13px;text-align:right;margin-top:4px;">incl. BTW</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Van</div>
      <div class="party-name">${companyName}</div>
      <div class="party-info">
        ${profile?.company_address ? escapeHtml(profile.company_address) + '<br>' : ''}
        ${profile?.company_postal ? escapeHtml(profile.company_postal) + ' ' : ''}${profile?.company_city ? escapeHtml(profile.company_city) + '<br>' : ''}
        ${profile?.company_kvk ? 'KvK: ' + escapeHtml(profile.company_kvk) + '<br>' : ''}
        ${profile?.company_btw ? 'BTW: ' + escapeHtml(profile.company_btw) + '<br>' : ''}
        ${profile?.company_iban ? 'IBAN: ' + escapeHtml(profile.company_iban) : ''}
      </div>
    </div>
    ${quote.clients ? `<div>
      <div class="party-label">Aan</div>
      ${clientCompany ? `<div class="party-name">${clientCompany}</div>` : ''}
      <div class="party-info">
        ${clientName}<br>
        ${escapeHtml(String(quote.clients.email || ''))}
      </div>
    </div>` : ''}
  </div>

  <div class="dates">
    <span style="color:#64748b;"><strong>Factuurdatum:</strong> ${formatDate(invoice?.created_at || new Date().toISOString())}</span>
    ${invoice?.due_date ? `<span style="color:#64748b;"><strong>Betaaldatum:</strong> ${formatDate(invoice.due_date)}</span>` : ''}
  </div>

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
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotaal</span><span>${formatCurrency(quote.subtotal)}</span></div>
    <div class="totals-row"><span>BTW</span><span>${formatCurrency(quote.vat_amount)}</span></div>
    <div class="totals-row total"><span>Totaal te betalen</span><span>${formatCurrency(quote.total)}</span></div>
  </div>

  ${profile?.company_iban ? `<div class="payment-info">
    <div class="payment-title">Betaalinformatie</div>
    <p style="font-size:14px;color:#0369a1;">Graag ${formatCurrency(quote.total)} overmaken op IBAN <strong>${escapeHtml(profile.company_iban)}</strong> t.n.v. ${companyName}${invoice?.due_date ? ` voor ${formatDate(invoice.due_date)}` : ''}.</p>
    <p style="font-size:13px;color:#0284c7;margin-top:4px;">Vermeld: ${invoiceNumber}</p>
  </div>` : ''}
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="factuur-${invoiceNumber}.html"`,
    },
  })
}
