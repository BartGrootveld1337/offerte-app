'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDate, formatDateTime, statusLabel, eventLabel, eventColor } from '@/lib/utils'
import type { Quote, Profile, QuoteEvent, QuoteItem } from '@/types'
import { Send, Edit, Copy, CheckCircle, ArrowLeft, Clock, Download, Eye, X, Loader2, FileText, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

interface QuoteDetailProps {
  quote: Quote & { quote_items?: QuoteItem[] }
  profile: Profile | null
  events: QuoteEvent[]
  autoSend?: boolean
}

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'sent': return { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
    case 'signed': return { background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }
    case 'draft': return { background: 'rgba(107,107,122,0.15)', color: '#a0a0b0', border: '1px solid rgba(107,107,122,0.25)' }
    case 'expired': return { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
    case 'declined': return { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
    default: return { background: 'rgba(107,107,122,0.15)', color: '#a0a0b0' }
  }
}

const inputStyle: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
}

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)'
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.boxShadow = 'none'
}

const supabaseClient = createClient()

export default function QuoteDetail({ quote, profile, events, autoSend }: QuoteDetailProps) {
  const router = useRouter()
  // supabaseClient defined at module level to avoid useEffect dependency issues
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showSendModal, setShowSendModal] = useState(autoSend || false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
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
      await supabaseClient.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quote.id)
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

  const [notes, setNotes] = useState(quote.notes || '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const handleSaveNotes = async () => {
    if (notes.length > 5000) {
      toast.error('Notities mogen maximaal 5000 tekens bevatten')
      return
    }
    setSavingNotes(true)
    await supabaseClient.from('quotes').update({ notes }).eq('id', quote.id)
    setSavingNotes(false)
    setEditingNotes(false)
    toast.success('Notities opgeslagen')
  }

  const [duplicating, setDuplicating] = useState(false)
  const handleDuplicate = async () => {
    setDuplicating(true)
    const res = await fetch('/api/quotes/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: quote.id }),
    })
    if (res.ok) {
      const { id } = await res.json()
      toast.success('Offerte gedupliceerd!')
      router.push(`/quotes/${id}/edit`)
    } else {
      toast.error('Dupliceren mislukt')
    }
    setDuplicating(false)
  }

  useEffect(() => {
    if (quote.status !== 'sent') return
    const interval = setInterval(async () => {
      const { data } = await supabaseClient
        .from('quote_events')
        .select('*')
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: false })
      if (data) setLiveEvents(data)
    }, 15000)
    return () => clearInterval(interval)
  }, [quote.status, quote.id])

  const cardStyle: React.CSSProperties = {
    background: '#1e1e2a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  }

  const btnOutlineStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#a0a0b0',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  const btnGradientStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: 'white',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
    transition: 'all 0.15s',
    border: 'none',
  }

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 transition-colors text-sm"
          style={{ color: '#6b6b7a' }}
        >
          <ArrowLeft size={16} /> Terug naar dashboard
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadPDF} style={btnOutlineStyle}>
            <Download size={16} /> Download PDF
          </button>
          <button onClick={handleDuplicate} disabled={duplicating} style={btnOutlineStyle}>
            <Copy size={16} /> {duplicating ? 'Bezig...' : 'Dupliceer'}
          </button>
          <Link href={`/quotes/${quote.id}/edit`} style={{ ...btnOutlineStyle, textDecoration: 'none' }}>
            <Edit size={16} /> Bewerken
          </Link>
          {quote.status === 'signed' && (
            <Link href={`/invoices/${quote.id}`} style={{ ...btnGradientStyle, textDecoration: 'none' }}>
              <Receipt size={16} /> Factuur
            </Link>
          )}
          {quote.status !== 'signed' && quote.status !== 'declined' && (
            <button onClick={() => setShowSendModal(true)} style={btnGradientStyle}>
              <Send size={16} /> Versturen
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {quote.status === 'signed' && (
        <div
          className="p-4 mb-6 flex items-center gap-3 rounded-2xl"
          style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)' }}
        >
          <CheckCircle className="flex-shrink-0" size={20} style={{ color: '#22d3ee' }} />
          <div>
            <p className="font-bold" style={{ color: '#22d3ee' }}>Ondertekend door {quote.signed_name}</p>
            <p className="text-sm" style={{ color: '#a0a0b0' }}>{quote.signed_at ? formatDate(quote.signed_at) : ''}</p>
          </div>
        </div>
      )}

      {/* Expired warning banner */}
      {quote.status === 'sent' && quote.valid_until && new Date(quote.valid_until) < new Date() && (
        <div
          className="p-4 mb-6 rounded-2xl flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <p style={{ color: '#fbbf24' }}>
              <strong>Deze offerte is verlopen op {formatDate(quote.valid_until)}</strong>
            </p>
          </div>
          <button
            onClick={async () => {
              await supabaseClient.from('quotes').update({ status: 'expired' }).eq('id', quote.id)
              toast.success('Status bijgewerkt naar Verlopen')
              router.refresh()
            }}
            style={{
              background: 'rgba(234,179,8,0.15)',
              border: '1px solid rgba(234,179,8,0.3)',
              color: '#fbbf24',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Markeer als verlopen
          </button>
        </div>
      )}

      {quote.status === 'declined' && (
        <div
          className="p-4 mb-6 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <X className="flex-shrink-0" size={20} style={{ color: '#f87171' }} />
            <p className="font-bold" style={{ color: '#f87171' }}>Offerte afgewezen</p>
          </div>
          {quote.declined_reason && (
            <p className="text-sm ml-8" style={{ color: '#a0a0b0' }}>Reden: {quote.declined_reason}</p>
          )}
        </div>
      )}

      {(sent || quote.status === 'sent') && quote.status !== 'signed' && quote.status !== 'declined' && (
        <div
          className="p-4 mb-6 flex items-center justify-between rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <div className="flex items-center gap-3">
            {hasOpened ? <Eye size={20} style={{ color: '#818cf8' }} /> : <Clock size={20} style={{ color: '#818cf8' }} />}
            <div>
              <p className="font-bold" style={{ color: '#818cf8' }}>
                {hasOpened ? '👁 Geopend door klant' : 'Verstuurd — wacht op ondertekening'}
              </p>
              <p className="text-xs break-all" style={{ color: '#6b6b7a' }}>{signUrl}</p>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 ml-4 flex-shrink-0 text-sm font-medium"
            style={{ color: '#818cf8' }}
          >
            <Copy size={14} /> Kopieer
          </button>
        </div>
      )}

      {/* Quote preview */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(145deg, #12121a 0%, #1a1a25 100%)',
            padding: '32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gradient accent top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #6366f1, #a855f7, #22d3ee)',
            }}
          />
          <div className="flex justify-between items-start flex-wrap gap-4 mt-2">
            <div>
              {profile?.logo_url && (
                <img src={profile.logo_url} alt="Logo" className="h-10 mb-4 object-contain" />
              )}
              <h1
                className="text-3xl font-bold"
                style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
              >
                {quote.title}
              </h1>
              <p className="font-mono text-sm mt-1" style={{ color: '#6b6b7a' }}>{quote.quote_number}</p>
            </div>
            <div className="text-right">
              <p
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(quote.total)}
              </p>
              <p className="text-sm mt-1" style={{ color: '#6b6b7a' }}>incl. BTW</p>
              <span
                className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={statusBadgeStyle(quote.status)}
              >
                {statusLabel(quote.status)}
              </span>
              {hasOpened && (
                <div className="mt-2 flex items-center gap-1 justify-end">
                  <Eye size={12} style={{ color: '#22d3ee' }} />
                  <span className="text-xs" style={{ color: '#22d3ee' }}>Bekeken</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Van</p>
              <p className="font-bold" style={{ color: '#ffffff' }}>{profile?.company_name}</p>
              {profile?.company_address && <p style={{ color: '#a0a0b0' }}>{profile.company_address}</p>}
              {profile?.company_city && <p style={{ color: '#a0a0b0' }}>{profile.company_postal} {profile.company_city}</p>}
              {profile?.company_kvk && <p className="text-xs" style={{ color: '#6b6b7a' }}>KvK: {profile.company_kvk}</p>}
              {profile?.company_btw && <p className="text-xs" style={{ color: '#6b6b7a' }}>BTW: {profile.company_btw}</p>}
            </div>
            {quote.clients && (
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Aan</p>
                {quote.clients.company && <p className="font-bold" style={{ color: '#ffffff' }}>{quote.clients.company}</p>}
                <p style={{ color: '#a0a0b0' }}>{quote.clients.name}</p>
                <p style={{ color: '#818cf8' }}>{quote.clients.email}</p>
                {quote.clients.address && <p style={{ color: '#a0a0b0' }}>{quote.clients.address}</p>}
              </div>
            )}
          </div>

          <div
            className="flex gap-6 text-sm pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#a0a0b0' }}
          >
            <span><strong style={{ color: '#ffffff' }}>Datum:</strong> {formatDate(quote.created_at)}</span>
            {quote.valid_until && (
              <span><strong style={{ color: '#ffffff' }}>Geldig tot:</strong> {formatDate(quote.valid_until)}</span>
            )}
          </div>

          {quote.intro && (
            <p
              className="text-sm whitespace-pre-wrap pl-4 py-3 rounded-r-xl"
              style={{
                color: '#a0a0b0',
                borderLeft: '3px solid rgba(99,102,241,0.5)',
                background: 'rgba(99,102,241,0.05)',
              }}
            >
              {quote.intro}
            </p>
          )}

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th
                  className="text-left py-3 px-4 text-xs uppercase font-semibold rounded-tl-xl"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  Omschrijving
                </th>
                <th className="text-center py-3 px-3 w-20 text-xs uppercase font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Aantal</th>
                <th className="text-right py-3 px-3 w-28 text-xs uppercase font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Prijs</th>
                <th className="text-center py-3 px-3 w-16 text-xs uppercase font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>BTW</th>
                <th className="text-right py-3 px-4 w-28 text-xs uppercase font-semibold rounded-tr-xl" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quote.quote_items?.map((item: QuoteItem, i: number) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <td className="py-3 px-4 font-medium" style={{ color: '#ffffff' }}>{item.description}</td>
                  <td className="py-3 px-3 text-center" style={{ color: '#a0a0b0' }}>{item.quantity} {item.unit}</td>
                  <td className="py-3 px-3 text-right" style={{ color: '#a0a0b0' }}>{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 px-3 text-center" style={{ color: '#6b6b7a' }}>{item.vat_rate}%</td>
                  <td className="py-3 px-4 text-right font-semibold" style={{ color: '#ffffff' }}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
              <span>Subtotaal</span><span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {((quote.discount_percent || 0) > 0 || (quote.discount_amount || 0) > 0) && (
              <div className="flex justify-between" style={{ color: '#f87171' }}>
                <span>Korting</span>
                <span>
                  {(quote.discount_percent || 0) > 0 ? `-${quote.discount_percent}%` : ''}{' '}
                  {(quote.discount_amount || 0) > 0 ? `- ${formatCurrency(quote.discount_amount || 0)}` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
              <span>BTW</span><span>{formatCurrency(quote.vat_amount)}</span>
            </div>
            <div
              className="flex justify-between font-bold text-base pt-2"
              style={{ borderTop: '2px solid rgba(99,102,241,0.3)', color: '#ffffff' }}
            >
              <span>Totaal</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>

          {quote.footer && (
            <p
              className="text-sm whitespace-pre-wrap pt-4"
              style={{ color: '#6b6b7a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {quote.footer}
            </p>
          )}

          {quote.signed_at && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>
                Digitale handtekening
              </p>
              {quote.signature_url && (
                <img
                  src={quote.signature_url}
                  alt="Handtekening"
                  className="h-16 rounded-lg p-2"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)' }}
                />
              )}
              <p className="text-sm mt-2" style={{ color: '#a0a0b0' }}>
                Ondertekend door <strong style={{ color: '#ffffff' }}>{quote.signed_name}</strong> op {formatDate(quote.signed_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Events timeline */}
      {liveEvents.length > 0 && (
        <div style={{ ...cardStyle, padding: '24px', marginTop: '24px' }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#ffffff' }}>
            <FileText size={16} style={{ color: '#6366f1' }} />
            Activiteitenlog
          </h3>
          <div className="space-y-3">
            {liveEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0" style={eventColor(event.event_type)}>
                  {event.event_type === 'opened' && '👁 '}
                  {event.event_type === 'signed' && '✅ '}
                  {event.event_type === 'declined' && '❌ '}
                  {event.event_type === 'sent' && '📧 '}
                  {eventLabel(event.event_type)}
                </span>
                <div>
                  <p className="text-xs" style={{ color: '#6b6b7a' }}>{formatDateTime(event.created_at)}</p>
                  {event.ip_address && event.ip_address !== 'unknown' && (
                    <p className="text-xs" style={{ color: '#6b6b7a' }}>IP: {event.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal notes */}
      <div style={{ ...cardStyle, padding: '24px', marginTop: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
            <FileText size={16} style={{ color: '#6366f1' }} />
            Interne notities
            <span className="text-xs font-normal" style={{ color: '#6b6b7a' }}>(niet zichtbaar voor klant)</span>
          </h3>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              style={{ color: '#818cf8', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Bewerken
            </button>
          )}
        </div>
        {editingNotes ? (
          <div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Voeg interne notities toe..."
              style={{
                background: '#12121a',
                border: '1px solid rgba(99,102,241,0.4)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '10px 14px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {savingNotes ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                onClick={() => { setEditingNotes(false); setNotes(quote.notes || '') }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a0a0b0',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{ color: notes ? '#a0a0b0' : '#6b6b7a', fontSize: '14px', cursor: 'pointer', minHeight: '40px' }}
            onClick={() => setEditingNotes(true)}
          >
            {notes || 'Klik om notities toe te voegen...'}
          </p>
        )}
      </div>

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: '#1a1a25',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
              Offerte versturen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#a0a0b0' }}>Naam klant</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  placeholder="Voornaam Achternaam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#a0a0b0' }}>E-mailadres klant</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  placeholder="klant@bedrijf.nl"
                />
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: '#6b6b7a' }}>Ondertekeningslink:</p>
                <p className="font-mono text-xs break-all" style={{ color: '#818cf8' }}>{signUrl}</p>
              </div>

              {/* Email preview toggle */}
              <button
                onClick={() => setShowEmailPreview(v => !v)}
                className="text-sm font-medium"
                style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                {showEmailPreview ? '▲ Verberg e-mailpreview' : '▼ Toon e-mailpreview'}
              </button>

              {showEmailPreview && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#ffffff' }}
                >
                  {/* Fake email preview */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>Van: {profile?.company_name || 'Vrijdag.AI'} &lt;noreply&gt;</p>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>Aan: {clientEmail || 'klant@bedrijf.nl'}</p>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>Onderwerp: Offerte {quote.quote_number} van {profile?.company_name || 'Vrijdag.AI'}</p>
                  </div>
                  <div style={{ padding: '20px', background: '#fff' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      {profile?.logo_url && <img src={profile.logo_url} alt="Logo" style={{ height: '32px', marginBottom: '8px' }} />}
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Offerte van {profile?.company_name || 'Vrijdag.AI'}
                      </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
                      Beste {clientName || '[naam klant]'},
                    </p>
                    <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                      Hierbij ontvangt u offerte <strong>{quote.quote_number}</strong> voor een totaalbedrag van <strong>{formatCurrency(quote.total)}</strong> incl. BTW.
                    </p>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}>
                        Bekijk &amp; onderteken offerte →
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                      {profile?.company_email} · {profile?.company_phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 rounded-xl font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a0a0b0',
                }}
              >
                Annuleren
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a0a0b0',
                }}
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !clientEmail}
                className="flex-1 px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                  border: 'none',
                }}
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
