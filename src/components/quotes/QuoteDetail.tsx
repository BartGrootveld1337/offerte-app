'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDate, statusLabel, statusColor } from '@/lib/utils'
import type { Quote, Profile } from '@/types'
import { Send, Edit, Copy, CheckCircle, ArrowLeft, ExternalLink, Clock } from 'lucide-react'

interface QuoteDetailProps {
  quote: Quote & { quote_items?: any[] }
  profile: Profile | null
  autoSend?: boolean
}

export default function QuoteDetail({ quote, profile, autoSend }: QuoteDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showSendModal, setShowSendModal] = useState(autoSend || false)
  const [clientEmail, setClientEmail] = useState(quote.clients?.email || '')
  const [clientName, setClientName] = useState(quote.clients?.name || '')

  const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign/${quote.sign_token}`

  const handleSend = async () => {
    setSending(true)
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: quote.id,
        clientEmail,
        clientName,
        signUrl,
        quoteNumber: quote.quote_number,
        total: formatCurrency(quote.total),
        companyName: profile?.company_name || 'Break the Norm B.V.',
      }),
    })
    if (res.ok) {
      await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quote.id)
      setSent(true)
      setShowSendModal(false)
    }
    setSending(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signUrl)
    alert('Ondertekeningslink gekopieerd!')
  }

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Terug naar dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Edit size={16} /> Bewerken
          </Link>
          {quote.status !== 'signed' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
            >
              <Send size={16} /> Versturen
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {quote.status === 'signed' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-bold text-green-800">Ondertekend door {quote.signed_name}</p>
            <p className="text-green-700 text-sm">{quote.signed_at ? formatDate(quote.signed_at) : ''}</p>
          </div>
        </div>
      )}

      {(sent || quote.status === 'sent') && quote.status !== 'signed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={20} />
            <div>
              <p className="font-bold text-blue-800">Verstuurd — wacht op ondertekening</p>
              <p className="text-blue-700 text-sm text-xs break-all">{signUrl}</p>
            </div>
          </div>
          <button onClick={handleCopyLink} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ml-4">
            <Copy size={14} /> Kopieer link
          </button>
        </div>
      )}

      {/* Quote preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{quote.title}</h1>
              <p className="text-slate-400 mt-1 font-mono">{quote.quote_number}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(quote.total)}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor(quote.status)}`}>
                {statusLabel(quote.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* From / To */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Van</p>
              <p className="font-bold text-slate-900">{profile?.company_name}</p>
              {profile?.company_address && <p className="text-slate-600">{profile.company_address}</p>}
              {profile?.company_city && <p className="text-slate-600">{profile.company_postal} {profile.company_city}</p>}
              {profile?.company_email && <p className="text-slate-600">{profile.company_email}</p>}
            </div>
            {quote.clients && (
              <div>
                <p className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Aan</p>
                {quote.clients.company && <p className="font-bold text-slate-900">{quote.clients.company}</p>}
                <p className="text-slate-600">{quote.clients.name}</p>
                <p className="text-slate-600">{quote.clients.email}</p>
                {quote.clients.address && <p className="text-slate-600">{quote.clients.address}</p>}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
            <span><strong>Datum:</strong> {formatDate(quote.created_at)}</span>
            {quote.valid_until && <span><strong>Geldig tot:</strong> {formatDate(quote.valid_until)}</span>}
          </div>

          {/* Intro */}
          {quote.intro && <p className="text-slate-700 text-sm whitespace-pre-wrap">{quote.intro}</p>}

          {/* Items table */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-500 font-semibold">Omschrijving</th>
                <th className="text-center py-2 text-slate-500 font-semibold w-20">Aantal</th>
                <th className="text-right py-2 text-slate-500 font-semibold w-28">Prijs</th>
                <th className="text-center py-2 text-slate-500 font-semibold w-16">BTW</th>
                <th className="text-right py-2 text-slate-500 font-semibold w-28">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quote.quote_items?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-800">{item.description}</td>
                  <td className="py-3 text-center text-slate-600">{item.quantity} {item.unit}</td>
                  <td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-center text-slate-600">{item.vat_rate}%</td>
                  <td className="py-3 text-right font-medium text-slate-800">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotaal</span><span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>BTW</span><span>{formatCurrency(quote.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t-2 border-slate-200 pt-2">
              <span>Totaal</span><span>{formatCurrency(quote.total)}</span>
            </div>
          </div>

          {/* Footer */}
          {quote.footer && <p className="text-slate-600 text-sm whitespace-pre-wrap border-t border-slate-100 pt-4">{quote.footer}</p>}

          {/* Signature */}
          {quote.signed_at && (
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Digitale handtekening</p>
              {quote.signature_url && <img src={quote.signature_url} alt="Handtekening" className="h-16 border border-slate-200 rounded-lg p-2" />}
              <p className="text-sm text-slate-600 mt-2">
                Ondertekend door <strong>{quote.signed_name}</strong> op {formatDate(quote.signed_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Offerte versturen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Naam klant</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Voornaam Achternaam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mailadres klant</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="klant@bedrijf.nl"
                />
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                <p className="font-medium mb-1">Ondertekeningslink:</p>
                <p className="font-mono break-all">{signUrl}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Kopieer link
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !clientEmail}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} /> {sending ? 'Versturen...' : 'Versturen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
