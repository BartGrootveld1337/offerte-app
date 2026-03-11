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

  // Log 'opened' event on page load
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Bedankt!</h1>
          <p className="text-slate-600 text-lg mb-2">
            Offerte <span className="font-semibold">{quote.quote_number}</span> is succesvol ondertekend.
          </p>
          <p className="text-slate-500 text-sm">
            We nemen zo snel mogelijk contact met je op om de volgende stappen te bespreken.
          </p>
          <div className="mt-8 p-4 bg-green-50 rounded-2xl">
            <p className="text-green-700 text-sm font-medium">{profile?.company_name}</p>
            {profile?.company_email && <p className="text-green-600 text-sm">{profile.company_email}</p>}
            {profile?.company_phone && <p className="text-green-600 text-sm">{profile.company_phone}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'declined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-12">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Offerte afgewezen</h1>
          <p className="text-slate-500 text-sm">
            Je hebt de offerte afgewezen. {profile?.company_name} is op de hoogte gesteld.
          </p>
          {profile?.company_email && (
            <p className="mt-4 text-sm text-slate-400">
              Neem contact op via <a href={`mailto:${profile.company_email}`} className="text-blue-600 hover:underline">{profile.company_email}</a> als je vragen hebt.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Elegant Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                  {(profile?.company_name || 'A').charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-xl">{profile?.company_name}</p>
                {profile?.company_website && (
                  <p className="text-slate-400 text-sm">{profile.company_website}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-wider">Offerte</p>
              <p className="font-mono font-semibold text-slate-300">{quote.quote_number}</p>
            </div>
          </div>
        </div>
        {/* Decorative bottom */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-indigo-600" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Quote title card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{quote.title}</h1>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                  <span>📅 Datum: <strong className="text-slate-700">{formatDate(quote.created_at)}</strong></span>
                  {quote.valid_until && (
                    <span>⏰ Geldig tot: <strong className="text-slate-700">{formatDate(quote.valid_until)}</strong></span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-900">{formatCurrency(quote.total)}</p>
                <p className="text-slate-400 text-sm mt-1">inclusief BTW</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* From / To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Van</p>
                <p className="font-bold text-slate-900">{profile?.company_name}</p>
                {profile?.company_address && <p className="text-slate-600 mt-0.5">{profile.company_address}</p>}
                {profile?.company_city && <p className="text-slate-600">{profile.company_postal} {profile.company_city}</p>}
                {profile?.company_email && <p className="text-blue-600 mt-1">{profile.company_email}</p>}
                {profile?.company_phone && <p className="text-slate-600">{profile.company_phone}</p>}
              </div>
              {quote.clients && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Aan</p>
                  {quote.clients.company && <p className="font-bold text-slate-900">{quote.clients.company}</p>}
                  <p className="text-slate-600">{quote.clients.name}</p>
                  <p className="text-blue-600">{quote.clients.email}</p>
                  {quote.clients.address && <p className="text-slate-600 mt-0.5">{quote.clients.address}</p>}
                  {quote.clients.city && <p className="text-slate-600">{quote.clients.postal} {quote.clients.city}</p>}
                </div>
              )}
            </div>

            {/* Intro */}
            {quote.intro && (
              <div className="mb-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-amber-50 border-l-4 border-amber-200 pl-4 py-3 rounded-r-xl">
                {quote.intro}
              </div>
            )}

            {/* Items */}
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left py-3 px-4 rounded-tl-xl">Omschrijving</th>
                  <th className="text-center py-3 px-3 w-20">Aantal</th>
                  <th className="text-right py-3 px-3 w-28">Prijs</th>
                  <th className="text-center py-3 px-3 w-16">BTW</th>
                  <th className="text-right py-3 px-4 w-28 rounded-tr-xl">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {quote.quote_items?.map((item: any, i: number) => (
                  <tr key={i} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="py-3 px-4 text-slate-800 font-medium">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.vat_rate}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 py-1">
                <span>Subtotaal (excl. BTW)</span><span className="font-medium">{formatCurrency(quote.subtotal)}</span>
              </div>
              {((quote.discount_percent || 0) > 0 || (quote.discount_amount || 0) > 0) && (
                <div className="flex justify-between text-red-600 py-1">
                  <span>Korting</span>
                  <span className="font-medium">
                    {(quote.discount_percent || 0) > 0 ? `-${quote.discount_percent}%` : ''}
                    {(quote.discount_amount || 0) > 0 ? ` - ${formatCurrency(quote.discount_amount || 0)}` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 py-1">
                <span>BTW</span><span className="font-medium">{formatCurrency(quote.vat_amount)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-xl border-t-2 border-slate-900 pt-3">
                <span>Totaal</span><span>{formatCurrency(quote.total)}</span>
              </div>
            </div>

            {/* Footer */}
            {quote.footer && (
              <p className="text-slate-500 text-sm whitespace-pre-wrap border-t border-slate-100 pt-4 mt-4">{quote.footer}</p>
            )}
          </div>
        </div>

        {/* Action block */}
        {pageState === 'view' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Wat is uw beslissing?</h2>
            <p className="text-slate-500 text-sm mb-8">
              Bekijk de offerte hierboven zorgvuldig. Klik op &quot;Akkoord&quot; om te ondertekenen, of &quot;Afwijzen&quot; als u vragen heeft.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setPageState('decline')}
                className="flex-1 flex items-center justify-center gap-3 py-4 border-2 border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-2xl font-semibold transition-all"
              >
                <ThumbsDown size={20} />
                Afwijzen
              </button>
              <button
                onClick={() => setPageState('accept')}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ondertekening</h2>
                <p className="text-slate-500 text-sm">Zet uw handtekening en bevestig</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Uw volledige naam *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Voornaam Achternaam"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Handtekening *</label>
                <button
                  onClick={() => sigPad.current?.clear()}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Wissen
                </button>
              </div>
              <div className="border-2 border-dashed border-blue-200 rounded-xl overflow-hidden bg-blue-50/30 hover:border-blue-300 transition-colors">
                <SignatureCanvas
                  ref={sigPad}
                  canvasProps={{ className: 'w-full', height: 180 }}
                  backgroundColor="rgba(239,246,255,0.5)"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Teken met uw vinger of muis in het vak hierboven</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Door te ondertekenen verklaart u akkoord te gaan met de offerte van{' '}
                <strong>{formatCurrency(quote.total)}</strong> incl. BTW zoals beschreven in dit document.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPageState('view')}
                className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleSign}
                disabled={processing}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Verwerken...</span>
                ) : (
                  <><CheckCircle size={18} /> Akkoord & ondertekenen</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Decline block */}
        {pageState === 'decline' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <ThumbsDown size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Offerte afwijzen</h2>
                <p className="text-slate-500 text-sm">Optioneel: geef een reden op</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reden voor afwijzing (optioneel)
              </label>
              <textarea
                value={declinedReason}
                onChange={e => setDeclinedReason(e.target.value)}
                rows={4}
                placeholder="Bijv: De prijs past niet binnen ons budget, we gaan met een andere leverancier in zee, ..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-sm resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPageState('view')}
                className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {processing ? 'Verwerken...' : 'Offerte afwijzen'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-12 text-center text-slate-400 text-xs">
        <p>Aangeboden door {profile?.company_name}</p>
        {profile?.company_website && <p className="mt-1">{profile.company_website}</p>}
        <p className="mt-1">Aangedreven door Vrijdag.AI Offerte Platform</p>
      </div>
    </div>
  )
}
