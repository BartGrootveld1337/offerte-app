'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDate, formatDateTime, statusLabel, statusColor, eventLabel, eventColor } from '@/lib/utils'
import type { Quote, Profile, QuoteEvent } from '@/types'
import { Send, Edit, Copy, CheckCircle, ArrowLeft, Clock, Download, Eye, X, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface QuoteDetailProps {
  quote: Quote & { quote_items?: any[] }
  profile: Profile | null
  events: QuoteEvent[]
  autoSend?: boolean
}

export default function QuoteDetail({ quote, profile, events, autoSend }: QuoteDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showSendModal, setShowSendModal] = useState(autoSend || false)
  const [clientEmail, setClientEmail] = useState(quote.clients?.email || '')
  const [clientName, setClientName] = useState(quote.clients?.name || '')
  const [liveEvents, setLiveEvents] = useState<QuoteEvent[]>(events)

  const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/sign/${quote.sign_token}`

  const hasOpened = liveEvents.some(e => e.event_type === 'opened')

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
        validUntil: quote.valid_until,
        companyName: profile?.company_name || 'Vrijdag.AI',
        companyEmail: profile?.company_email,
        companyPhone: profile?.company_phone,
        companyWebsite: profile?.company_website,
      }),
    })
    if (res.ok) {
      await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quote.id)
      setSent(true)
      setShowSendModal(false)
      toast.success(`Offerte verstuurd naar ${clientEmail}`)
    } else {
      toast.error('E-mail versturen mislukt')
    }
    setSending(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signUrl)
    toast.success('Link gekopieerd!')
  }

  const handleDownloadPDF = () => {
    window.open(`/api/quotes/${quote.id}/pdf`, '_blank')
  }

  // Reload events periodically when quote is sent
  useEffect(() => {
    if (quote.status !== 'sent') return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('quote_events')
        .select('*')
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: false })
      if (data) setLiveEvents(data)
    }, 15000)
    return () => clearInterval(interval)
  }, [quote.status])

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Terug naar dashboard
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Download PDF
          </button>
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Edit size={16} /> Bewerken
          </Link>
          {quote.status !== 'signed' && quote.status !== 'declined' && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
            >
              <Send size={16} /> Versturen
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {quote.status === 'signed' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-bold text-green-800">Ondertekend door {quote.signed_name}</p>
            <p className="text-green-700 text-sm">{quote.signed_at ? formatDate(quote.signed_at) : ''}</p>
          </div>
        </div>
      )}

      {quote.status === 'declined' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <X className="text-red-600 flex-shrink-0" size={20} />
            <p className="font-bold text-red-800">Offerte afgewezen</p>
          </div>
          {quote.declined_reason && (
            <p className="text-red-700 text-sm ml-8">Reden: {quote.declined_reason}</p>
          )}
        </div>
      )}

      {(sent || quote.status === 'sent') && quote.status !== 'signed' && quote.status !== 'declined' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasOpened
              ? <Eye className="text-blue-600" size={20} />
              : <Clock className="text-blue-600" size={20} />}
            <div>
              <p className="font-bold text-blue-800">
                {hasOpened ? '👁 Geopend door klant' : 'Verstuurd — wacht op ondertekening'}
              </p>
              <p className="text-blue-600 text-xs break-all">{signUrl}</p>
            </div>
          </div>
          <button onClick={handleCopyLink} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ml-4 flex-shrink-0">
            <Copy size={14} /> Kopieer
          </button>
        </div>
      )}

      {/* Quote preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              {profile?.logo_url && (
                <img src={profile.logo_url} alt="Logo" className="h-10 mb-4 object-contain" />
              )}
              <h1 className="text-3xl font-bold">{quote.title}</h1>
              <p className="text-slate-400 mt-1 font-mono text-sm">{quote.quote_number}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatCurrency(quote.total)}</p>
              <p className="text-slate-400 text-sm">incl. BTW</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor(quote.status)}`}>
                {statusLabel(quote.status)}
              </span>
              {hasOpened && (
                <div className="mt-2 flex items-center gap-1 justify-end">
                  <Eye size={12} className="text-blue-400" />
                  <span className="text-blue-400 text-xs">Bekeken</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-2">Van</p>
              <p className="font-bold text-slate-900">{profile?.company_name}</p>
              {profile?.company_address && <p className="text-slate-600">{profile.company_address}</p>}
              {profile?.company_city && <p className="text-slate-600">{profile.company_postal} {profile.company_city}</p>}
              {profile?.company_kvk && <p className="text-slate-500 text-xs">KvK: {profile.company_kvk}</p>}
              {profile?.company_btw && <p className="text-slate-500 text-xs">BTW: {profile.company_btw}</p>}
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

          <div className="flex gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
            <span><strong>Datum:</strong> {formatDate(quote.created_at)}</span>
            {quote.valid_until && <span><strong>Geldig tot:</strong> {formatDate(quote.valid_until)}</span>}
          </div>

          {quote.intro && <p className="text-slate-700 text-sm whitespace-pre-wrap">{quote.intro}</p>}

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

          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotaal</span><span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {(quote.discount_percent || 0) > 0 || (quote.discount_amount || 0) > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Korting</span>
                <span>
                  {(quote.discount_percent || 0) > 0 ? `-${quote.discount_percent}%` : ''}{' '}
                  {(quote.discount_amount || 0) > 0 ? `- ${formatCurrency(quote.discount_amount || 0)}` : ''}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-600">
              <span>BTW</span><span>{formatCurrency(quote.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t-2 border-slate-200 pt-2">
              <span>Totaal</span><span>{formatCurrency(quote.total)}</span>
            </div>
          </div>

          {quote.footer && <p className="text-slate-600 text-sm whitespace-pre-wrap border-t border-slate-100 pt-4">{quote.footer}</p>}

          {quote.signed_at && (
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Digitale handtekening</p>
              {quote.signature_url && (
                <img src={quote.signature_url} alt="Handtekening" className="h-16 border border-slate-200 rounded-lg p-2 bg-slate-50" />
              )}
              <p className="text-sm text-slate-600 mt-2">
                Ondertekend door <strong>{quote.signed_name}</strong> op {formatDate(quote.signed_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Events timeline */}
      {liveEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={16} />
            Activiteitenlog
          </h3>
          <div className="space-y-3">
            {liveEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${eventColor(event.event_type)}`}>
                  {event.event_type === 'opened' && '👁 '}
                  {event.event_type === 'signed' && '✅ '}
                  {event.event_type === 'declined' && '❌ '}
                  {event.event_type === 'sent' && '📧 '}
                  {eventLabel(event.event_type)}
                </span>
                <div>
                  <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
                  {event.ip_address && event.ip_address !== 'unknown' && (
                    <p className="text-xs text-slate-400">IP: {event.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-600 mb-1">Ondertekeningslink:</p>
                <p className="font-mono text-xs text-slate-500 break-all">{signUrl}</p>
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !clientEmail}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Versturen...' : 'Versturen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
