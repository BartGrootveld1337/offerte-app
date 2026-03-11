'use client'

import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, Profile, QuoteItem } from '@/types'

interface Invoice {
  id: string
  invoice_number: string
  due_date?: string
  paid_at?: string
  created_at: string
}

interface Props {
  quote: Quote & { quote_items?: QuoteItem[] }
  profile: Profile | null
  invoice: Invoice | null
}

export default function InvoiceDetail({ quote, profile, invoice }: Props) {
  const cardStyle: React.CSSProperties = {
    background: '#1e1e2a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2 text-sm" style={{ color: '#6b6b7a' }}>
          <ArrowLeft size={16} /> Terug naar offerte
        </Link>
        <button
          onClick={() => window.open(`/api/invoices/${quote.id}/pdf`, '_blank')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Invoice */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(145deg, #12121a 0%, #1a1a25 100%)',
            padding: '32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #22d3ee, #6366f1, #a855f7)' }} />
          <div className="flex justify-between items-start flex-wrap gap-4 mt-2">
            <div>
              {profile?.logo_url && (
                <img src={profile.logo_url} alt="Logo" className="h-10 mb-4 object-contain" />
              )}
              <h1
                className="text-3xl font-bold"
                style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
              >
                FACTUUR
              </h1>
              <p className="font-mono text-sm mt-1" style={{ color: '#6b6b7a' }}>
                {invoice?.invoice_number || 'INV-...'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b7a' }}>
                Op basis van offerte {quote.quote_number}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(quote.total)}
              </p>
              <p className="text-sm mt-1" style={{ color: '#6b6b7a' }}>incl. BTW</p>
              {invoice?.paid_at ? (
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }}
                >
                  ✓ Betaald
                </span>
              ) : (
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}
                >
                  Openstaand
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* From/To */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Van</p>
              <p className="font-bold" style={{ color: '#ffffff' }}>{profile?.company_name}</p>
              {profile?.company_address && <p style={{ color: '#a0a0b0' }}>{profile.company_address}</p>}
              {profile?.company_city && <p style={{ color: '#a0a0b0' }}>{profile.company_postal} {profile.company_city}</p>}
              {profile?.company_kvk && <p className="text-xs" style={{ color: '#6b6b7a' }}>KvK: {profile.company_kvk}</p>}
              {profile?.company_btw && <p className="text-xs" style={{ color: '#6b6b7a' }}>BTW: {profile.company_btw}</p>}
              {profile?.company_iban && <p className="text-xs" style={{ color: '#6b6b7a' }}>IBAN: {profile.company_iban}</p>}
            </div>
            {quote.clients && (
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Aan</p>
                {quote.clients.company && <p className="font-bold" style={{ color: '#ffffff' }}>{quote.clients.company}</p>}
                <p style={{ color: '#a0a0b0' }}>{quote.clients.name}</p>
                <p style={{ color: '#818cf8' }}>{quote.clients.email}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div
            className="flex flex-wrap gap-6 text-sm pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#a0a0b0' }}
          >
            <span><strong style={{ color: '#ffffff' }}>Factuurdatum:</strong> {formatDate(invoice?.created_at || new Date().toISOString())}</span>
            {invoice?.due_date && (
              <span><strong style={{ color: '#ffffff' }}>Betaaltermijn:</strong> {formatDate(invoice.due_date)}</span>
            )}
          </div>

          {/* Items */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-xs uppercase font-semibold rounded-tl-xl" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>Omschrijving</th>
                <th className="text-center py-3 px-3 w-20 text-xs uppercase font-semibold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>Aantal</th>
                <th className="text-right py-3 px-3 w-28 text-xs uppercase font-semibold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>Prijs</th>
                <th className="text-center py-3 px-3 w-16 text-xs uppercase font-semibold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>BTW</th>
                <th className="text-right py-3 px-4 w-28 text-xs uppercase font-semibold rounded-tr-xl" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quote.quote_items?.map((item: QuoteItem, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td className="py-3 px-4 font-medium" style={{ color: '#ffffff' }}>{item.description}</td>
                  <td className="py-3 px-3 text-center" style={{ color: '#a0a0b0' }}>{item.quantity} {item.unit}</td>
                  <td className="py-3 px-3 text-right" style={{ color: '#a0a0b0' }}>{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 px-3 text-center" style={{ color: '#6b6b7a' }}>{item.vat_rate}%</td>
                  <td className="py-3 px-4 text-right font-semibold" style={{ color: '#ffffff' }}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
              <span>Subtotaal</span><span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
              <span>BTW</span><span>{formatCurrency(quote.vat_amount)}</span>
            </div>
            <div
              className="flex justify-between font-bold text-base pt-2"
              style={{ borderTop: '2px solid rgba(34,211,238,0.3)', color: '#ffffff' }}
            >
              <span>Totaal te betalen</span>
              <span style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>

          {/* Payment info */}
          {profile?.company_iban && (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#22d3ee' }}>Betaalinformatie</p>
              <p className="text-sm" style={{ color: '#a0a0b0' }}>
                Gelieve het bedrag van <strong style={{ color: '#ffffff' }}>{formatCurrency(quote.total)}</strong> over te maken op IBAN{' '}
                <strong style={{ color: '#ffffff' }}>{profile.company_iban}</strong>
                {profile.company_name && ` t.n.v. ${profile.company_name}`}
                {invoice?.due_date && ` vóór ${formatDate(invoice.due_date)}`}.
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b7a' }}>
                Vermeld factuurnummer: {invoice?.invoice_number}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
