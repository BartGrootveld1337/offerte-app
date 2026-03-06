'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { formatCurrency, formatDate, statusLabel } from '@/lib/utils'
import type { Quote, Profile } from '@/types'
import { CheckCircle, RotateCcw, FileText } from 'lucide-react'

interface SignPageProps {
  quote: Quote & { quote_items?: any[] }
  profile: Profile | null
  token: string
}

export default function SignPage({ quote, profile, token }: SignPageProps) {
  const sigPad = useRef<SignatureCanvas>(null)
  const [name, setName] = useState('')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(quote.status === 'signed')
  const [error, setError] = useState('')

  const handleSign = async () => {
    if (!name.trim()) { setError('Vul je naam in'); return }
    if (sigPad.current?.isEmpty()) { setError('Zet een handtekening'); return }
    setSigning(true)
    setError('')

    const signatureData = sigPad.current!.toDataURL()

    const res = await fetch('/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, signedName: name, signatureData }),
    })

    if (res.ok) {
      setSigned(true)
    } else {
      setError('Er is iets misgegaan. Probeer opnieuw.')
    }
    setSigning(false)
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ondertekend!</h1>
          <p className="text-slate-600">
            De offerte {quote.quote_number} is succesvol ondertekend.
            Beide partijen ontvangen een bevestiging per e-mail.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Offerte ter ondertekening</p>
            <h1 className="font-bold text-lg">{quote.title} — {quote.quote_number}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Company info + offerte */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Van</p>
                <p className="font-bold text-slate-900">{profile?.company_name}</p>
                {profile?.company_email && <p className="text-slate-600">{profile.company_email}</p>}
              </div>
              {quote.clients && (
                <div>
                  <p className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Aan</p>
                  {quote.clients.company && <p className="font-bold text-slate-900">{quote.clients.company}</p>}
                  <p className="text-slate-600">{quote.clients.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {quote.intro && <p className="text-slate-700 text-sm mb-6 whitespace-pre-wrap">{quote.intro}</p>}

            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 text-slate-500">Omschrijving</th>
                  <th className="text-center py-2 text-slate-500 w-20">Aantal</th>
                  <th className="text-right py-2 text-slate-500 w-28">Prijs</th>
                  <th className="text-right py-2 text-slate-500 w-28">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {quote.quote_items?.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 text-slate-800">{item.description}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity} {item.unit}</td>
                    <td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ml-auto w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotaal</span><span>{formatCurrency(quote.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>BTW</span><span>{formatCurrency(quote.vat_amount)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 text-base border-t-2 border-slate-200 pt-2">
                <span>Totaal</span><span>{formatCurrency(quote.total)}</span>
              </div>
            </div>

            {quote.footer && (
              <p className="text-slate-600 text-sm whitespace-pre-wrap border-t border-slate-100 pt-4 mt-4">{quote.footer}</p>
            )}
          </div>
        </div>

        {/* Signature block */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Ondertekening</h2>
          <p className="text-sm text-slate-600 mb-4">
            Door te ondertekenen ga je akkoord met de offerte van {formatCurrency(quote.total)} incl. BTW.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Jouw naam</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Volledige naam"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Handtekening</label>
              <button
                onClick={() => sigPad.current?.clear()}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Wissen
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
              <SignatureCanvas
                ref={sigPad}
                canvasProps={{ className: 'w-full', height: 160 }}
                backgroundColor="rgb(248,250,252)"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Teken met je vinger of muis</p>
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <button
            onClick={handleSign}
            disabled={signing}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {signing ? 'Bezig met ondertekenen...' : 'Akkoord & Ondertekenen'}
          </button>
        </div>
      </div>
    </div>
  )
}
