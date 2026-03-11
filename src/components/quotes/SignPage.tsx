'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, Profile } from '@/types'
import { CheckCircle, RotateCcw, ThumbsUp, ThumbsDown, ArrowRight, AlertCircle } from 'lucide-react'

interface SignPageProps {
  quote: Quote & { quote_items?: any[] }
  profile: Profile | null
  token: string
}

type PageState = 'view' | 'accept' | 'decline' | 'signed' | 'declined'

export default function SignPage({ quote, profile, token }: SignPageProps) {
  const sigPad = useRef<SignatureCanvas>(null)
  const [name, setName] = useState('')
  const [declinedReason, setDeclinedReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [pageState, setPageState] = useState<PageState>(
    quote.status === 'signed' ? 'signed' : quote.status === 'declined' ? 'declined' : 'view'
  )

  useEffect(() => {
    if (quote.status === 'signed' || quote.status === 'declined') return
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: quote.id, eventType: 'opened' }),
    }).catch(() => {})
  }, [])

  const handleSign = async () => {
    if (!name.trim()) { setError('Vul je naam in'); return }
    if (sigPad.current?.isEmpty()) { setError('Zet een handtekening'); return }
    setProcessing(true)
    setError('')
    const signatureData = sigPad.current!.toDataURL()
    const res = await fetch('/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, signedName: name, signatureData, action: 'sign' }),
    })
    if (res.ok) {
      setPageState('signed')
    } else {
      const data = await res.json()
      setError(data.error || 'Er is iets misgegaan. Probeer opnieuw.')
    }
    setProcessing(false)
  }

  const handleDecline = async () => {
    setProcessing(true)
    setError('')
    const res = await fetch('/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'decline', declinedReason }),
    })
    if (res.ok) {
      setPageState('declined')
    } else {
      const data = await res.json()
      setError(data.error || 'Er is iets misgegaan.')
    }
    setProcessing(false)
  }

  if (pageState === 'signed') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0a0a0f' }}
      >
        <div
          className="text-center max-w-md rounded-3xl p-12"
          style={{
            background: 'rgba(30,30,42,0.9)',
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 0 60px rgba(34,211,238,0.1)',
          }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,211,238,0.1)', border: '2px solid rgba(34,211,238,0.3)' }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: '#22d3ee' }} />
          </div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
          >
            Bedankt!
          </h1>
          <p className="text-lg mb-2" style={{ color: '#a0a0b0' }}>
            Offerte <span style={{ color: '#22d3ee', fontWeight: 600 }}>{quote.quote_number}</span> is succesvol ondertekend.
          </p>
          <p className="text-sm" style={{ color: '#6b6b7a' }}>
            We nemen zo snel mogelijk contact met je op om de volgende stappen te bespreken.
          </p>
          <div
            className="mt-8 p-4 rounded-2xl"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}
          >
            <p className="text-sm font-medium" style={{ color: '#22d3ee' }}>{profile?.company_name}</p>
            {profile?.company_email && <p className="text-sm" style={{ color: '#a0a0b0' }}>{profile.company_email}</p>}
            {profile?.company_phone && <p className="text-sm" style={{ color: '#a0a0b0' }}>{profile.company_phone}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'declined') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0a0a0f' }}
      >
        <div
          className="text-center max-w-md rounded-3xl p-12"
          style={{
            background: 'rgba(30,30,42,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(107,107,122,0.15)' }}
          >
            <AlertCircle className="w-12 h-12" style={{ color: '#6b6b7a' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#ffffff' }}>Offerte afgewezen</h1>
          <p className="text-sm" style={{ color: '#6b6b7a' }}>
            Je hebt de offerte afgewezen. {profile?.company_name} is op de hoogte gesteld.
          </p>
          {profile?.company_email && (
            <p className="mt-4 text-sm" style={{ color: '#6b6b7a' }}>
              Neem contact op via{' '}
              <a href={`mailto:${profile.company_email}`} style={{ color: '#818cf8' }}>
                {profile.company_email}
              </a>{' '}
              als je vragen hebt.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0a0a0f',
        backgroundImage: 'radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Gradient glow top right */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/vrijdag_ai_logo.svg"
                alt="Vrijdag.AI"
                style={{ height: '36px', width: 'auto' }}
              />
              {profile?.company_name && (
                <div
                  style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }}
                />
              )}
              {profile?.company_name && (
                <span
                  className="font-bold text-lg"
                  style={{
                    fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
                    color: '#ffffff',
                  }}
                >
                  {profile.company_name}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider" style={{ color: '#6b6b7a' }}>Offerte</p>
              <p className="font-mono font-semibold" style={{ color: '#818cf8' }}>{quote.quote_number}</p>
            </div>
          </div>
        </div>
        {/* Gradient accent bar */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #6366f1, #a855f7, #22d3ee)' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Quote title card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(30,30,42,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="p-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
                  }}
                >
                  {quote.title}
                </h1>
                <div className="flex flex-wrap gap-4 mt-3 text-sm" style={{ color: '#a0a0b0' }}>
                  <span>📅 Datum: <strong style={{ color: '#ffffff' }}>{formatDate(quote.created_at)}</strong></span>
                  {quote.valid_until && (
                    <span>⏰ Geldig tot: <strong style={{ color: '#ffffff' }}>{formatDate(quote.valid_until)}</strong></span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-4xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {formatCurrency(quote.total)}
                </p>
                <p className="text-sm mt-1" style={{ color: '#6b6b7a' }}>inclusief BTW</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* From / To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Van</p>
                <p className="font-bold" style={{ color: '#ffffff' }}>{profile?.company_name}</p>
                {profile?.company_address && <p style={{ color: '#a0a0b0', marginTop: '2px' }}>{profile.company_address}</p>}
                {profile?.company_city && <p style={{ color: '#a0a0b0' }}>{profile.company_postal} {profile.company_city}</p>}
                {profile?.company_email && <p style={{ color: '#818cf8', marginTop: '4px' }}>{profile.company_email}</p>}
                {profile?.company_phone && <p style={{ color: '#a0a0b0' }}>{profile.company_phone}</p>}
              </div>
              {quote.clients && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: '#6b6b7a' }}>Aan</p>
                  {quote.clients.company && <p className="font-bold" style={{ color: '#ffffff' }}>{quote.clients.company}</p>}
                  <p style={{ color: '#a0a0b0' }}>{quote.clients.name}</p>
                  <p style={{ color: '#818cf8' }}>{quote.clients.email}</p>
                  {quote.clients.address && <p style={{ color: '#a0a0b0', marginTop: '2px' }}>{quote.clients.address}</p>}
                  {quote.clients.city && <p style={{ color: '#a0a0b0' }}>{quote.clients.postal} {quote.clients.city}</p>}
                </div>
              )}
            </div>

            {/* Intro */}
            {quote.intro && (
              <div
                className="mb-6 text-sm leading-relaxed whitespace-pre-wrap pl-4 py-3 rounded-r-xl"
                style={{
                  color: '#a0a0b0',
                  borderLeft: '3px solid rgba(99,102,241,0.5)',
                  background: 'rgba(99,102,241,0.05)',
                }}
              >
                {quote.intro}
              </div>
            )}

            {/* Items table */}
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr>
                  <th
                    className="text-left py-3 px-4 rounded-tl-xl text-xs font-semibold uppercase"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                  >
                    Omschrijving
                  </th>
                  <th className="text-center py-3 px-3 w-20 text-xs font-semibold uppercase" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Aantal</th>
                  <th className="text-right py-3 px-3 w-28 text-xs font-semibold uppercase" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Prijs</th>
                  <th className="text-center py-3 px-3 w-16 text-xs font-semibold uppercase" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>BTW</th>
                  <th className="text-right py-3 px-4 w-28 rounded-tr-xl text-xs font-semibold uppercase" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Totaal</th>
                </tr>
              </thead>
              <tbody>
                {quote.quote_items?.map((item: any, i: number) => (
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

            {/* Totals */}
            <div className="ml-auto w-64 space-y-2 text-sm">
              <div className="flex justify-between py-1" style={{ color: '#a0a0b0' }}>
                <span>Subtotaal (excl. BTW)</span>
                <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
              </div>
              {((quote.discount_percent || 0) > 0 || (quote.discount_amount || 0) > 0) && (
                <div className="flex justify-between py-1" style={{ color: '#f87171' }}>
                  <span>Korting</span>
                  <span className="font-medium">
                    {(quote.discount_percent || 0) > 0 ? `-${quote.discount_percent}%` : ''}
                    {(quote.discount_amount || 0) > 0 ? ` - ${formatCurrency(quote.discount_amount || 0)}` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1" style={{ color: '#a0a0b0' }}>
                <span>BTW</span>
                <span className="font-medium">{formatCurrency(quote.vat_amount)}</span>
              </div>
              <div
                className="flex justify-between font-black text-xl pt-3"
                style={{
                  borderTop: '2px solid rgba(99,102,241,0.4)',
                  color: '#ffffff',
                }}
              >
                <span>Totaal</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>

            {/* Footer */}
            {quote.footer && (
              <p
                className="text-sm whitespace-pre-wrap pt-4 mt-4"
                style={{
                  color: '#6b6b7a',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {quote.footer}
              </p>
            )}
          </div>
        </div>

        {/* Action block - view */}
        {pageState === 'view' && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(30,30,42,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
            >
              Wat is uw beslissing?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#6b6b7a' }}>
              Bekijk de offerte hierboven zorgvuldig. Klik op &quot;Akkoord&quot; om te ondertekenen.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setPageState('decline')}
                className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all"
                style={{
                  border: '2px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                  background: 'rgba(239,68,68,0.05)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.05)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)'
                }}
              >
                <ThumbsDown size={20} />
                Afwijzen
              </button>
              <button
                onClick={() => setPageState('accept')}
                className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
                  color: 'white',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                  border: 'none',
                }}
              >
                <ThumbsUp size={20} />
                Akkoord & ondertekenen
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Accept / Sign block */}
        {pageState === 'accept' && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(30,30,42,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <CheckCircle size={20} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
                >
                  Ondertekening
                </h2>
                <p className="text-sm" style={{ color: '#6b6b7a' }}>Zet uw handtekening en bevestig</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#a0a0b0' }}>
                Uw volledige naam *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Voornaam Achternaam"
                className="w-full px-4 py-3 rounded-xl text-lg"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)')}
                onBlur={e => (e.target.style.boxShadow = 'none')}
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold" style={{ color: '#a0a0b0' }}>Handtekening *</label>
                <button
                  onClick={() => sigPad.current?.clear()}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: '#6b6b7a' }}
                >
                  <RotateCcw size={12} /> Wissen
                </button>
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  border: '2px dashed rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.05)',
                }}
              >
                <SignatureCanvas
                  ref={sigPad}
                  canvasProps={{ className: 'w-full', height: 180 }}
                  backgroundColor="transparent"
                  penColor="#818cf8"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6b6b7a' }}>
                Teken met uw vinger of muis in het vak hierboven
              </p>
            </div>

            <div
              className="rounded-xl p-4 mb-6"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <p className="text-sm" style={{ color: '#a0a0b0' }}>
                Door te ondertekenen verklaart u akkoord te gaan met de offerte van{' '}
                <strong style={{ color: '#818cf8' }}>{formatCurrency(quote.total)}</strong> incl. BTW zoals beschreven in dit document.
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPageState('view')}
                className="px-5 py-3 rounded-xl font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a0a0b0',
                }}
              >
                Terug
              </button>
              <button
                onClick={handleSign}
                disabled={processing}
                className="flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
                  color: 'white',
                  boxShadow: '0 6px 25px rgba(99,102,241,0.4)',
                  border: 'none',
                }}
              >
                {processing ? (
                  <><span className="animate-spin inline-block">⏳</span> Verwerken...</>
                ) : (
                  <><CheckCircle size={18} /> Akkoord & ondertekenen</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Decline block */}
        {pageState === 'decline' && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(30,30,42,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <ThumbsDown size={20} style={{ color: '#f87171' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Offerte afwijzen</h2>
                <p className="text-sm" style={{ color: '#6b6b7a' }}>Optioneel: geef een reden op</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#a0a0b0' }}>
                Reden voor afwijzing (optioneel)
              </label>
              <textarea
                value={declinedReason}
                onChange={e => setDeclinedReason(e.target.value)}
                rows={4}
                placeholder="Bijv: De prijs past niet binnen ons budget..."
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.3)')}
                onBlur={e => (e.target.style.boxShadow = 'none')}
              />
            </div>

            {error && (
              <div
                className="rounded-xl p-3 mb-4 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPageState('view')}
                className="px-5 py-3 rounded-xl font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a0a0b0',
                }}
              >
                Terug
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.25)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
                }}
              >
                {processing ? 'Verwerken...' : 'Offerte afwijzen'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs" style={{ color: '#6b6b7a' }}>Powered by</span>
          <img src="/vrijdag_ai_logo.svg" alt="Vrijdag.AI" style={{ height: '20px', width: 'auto', opacity: 0.6 }} />
        </div>
        <p className="text-xs" style={{ color: '#3a3a4a' }}>Vrijdag.AI Offerte Platform</p>
      </div>
    </div>
  )
}
