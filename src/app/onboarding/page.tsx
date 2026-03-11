'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ChevronRight, ChevronLeft, CheckCircle, Building2, Contact, FileText, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Bedrijfsgegevens', icon: Building2 },
  { id: 2, label: 'Contact', icon: Contact },
  { id: 3, label: 'Standaardteksten', icon: FileText },
  { id: 4, label: 'Klaar!', icon: Rocket },
]

const inputStyle: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#a0a0b0',
  marginBottom: '6px',
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    company_city: '',
    company_postal: '',
    company_kvk: '',
    company_btw: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    default_intro: 'Bedankt voor uw interesse. Hierbij ontvangt u onze offerte voor de gevraagde diensten.',
    default_footer: 'Deze offerte is 30 dagen geldig. Bij akkoord kunt u de offerte digitaal ondertekenen.',
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Niet ingelogd'); setSaving(false); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      default_vat_rate: 21,
      default_payment_days: 30,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    if (error) {
      toast.error('Fout bij opslaan: ' + error.message)
    } else {
      setStep(4)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/vrijdag_ai_logo.svg" alt="Vrijdag.AI" style={{ height: '40px', margin: '0 auto 16px' }} />
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welkom bij Vrijdag.AI Offerte
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6b6b7a' }}>Stel je account in om te beginnen</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: step > s.id
                    ? 'rgba(34,211,238,0.2)'
                    : step === s.id
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                    : 'rgba(107,107,122,0.2)',
                  color: step > s.id ? '#22d3ee' : step === s.id ? '#fff' : '#6b6b7a',
                  border: step >= s.id ? 'none' : '1px solid rgba(107,107,122,0.3)',
                }}
              >
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{ background: step > s.id ? 'rgba(34,211,238,0.3)' : 'rgba(107,107,122,0.2)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#1e1e2a',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-bold mb-6" style={{ color: '#fff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                Bedrijfsgegevens
              </h2>
              <div>
                <label style={labelStyle}>Bedrijfsnaam *</label>
                <input value={form.company_name} onChange={e => set('company_name', e.target.value)} style={inputStyle} placeholder="Vrijdag.AI" />
              </div>
              <div>
                <label style={labelStyle}>Adres</label>
                <input value={form.company_address} onChange={e => set('company_address', e.target.value)} style={inputStyle} placeholder="Straat 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Postcode</label>
                  <input value={form.company_postal} onChange={e => set('company_postal', e.target.value)} style={inputStyle} placeholder="1234 AB" />
                </div>
                <div>
                  <label style={labelStyle}>Stad</label>
                  <input value={form.company_city} onChange={e => set('company_city', e.target.value)} style={inputStyle} placeholder="Amsterdam" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>KvK nummer</label>
                  <input value={form.company_kvk} onChange={e => set('company_kvk', e.target.value)} style={inputStyle} placeholder="12345678" />
                </div>
                <div>
                  <label style={labelStyle}>BTW nummer</label>
                  <input value={form.company_btw} onChange={e => set('company_btw', e.target.value)} style={inputStyle} placeholder="NL123456789B01" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-bold mb-6" style={{ color: '#fff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                Contactgegevens
              </h2>
              <div>
                <label style={labelStyle}>E-mailadres</label>
                <input type="email" value={form.company_email} onChange={e => set('company_email', e.target.value)} style={inputStyle} placeholder="info@vrijdag.ai" />
              </div>
              <div>
                <label style={labelStyle}>Telefoonnummer</label>
                <input value={form.company_phone} onChange={e => set('company_phone', e.target.value)} style={inputStyle} placeholder="+31 6 12345678" />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input value={form.company_website} onChange={e => set('company_website', e.target.value)} style={inputStyle} placeholder="https://vrijdag.ai" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-bold mb-6" style={{ color: '#fff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                Standaardteksten
              </h2>
              <div>
                <label style={labelStyle}>Introductietekst</label>
                <textarea
                  value={form.default_intro}
                  onChange={e => set('default_intro', e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Voettekst</label>
                <textarea
                  value={form.default_footer}
                  onChange={e => set('default_footer', e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center animate-fadeIn py-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }}
              >
                <CheckCircle size={40} style={{ color: '#22d3ee' }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: '#fff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                Je bent klaar!
              </h2>
              <p className="mb-8" style={{ color: '#a0a0b0' }}>
                Je account is ingesteld. Maak nu je eerste offerte aan.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/quotes/new')}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  }}
                >
                  Maak je eerste offerte →
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 rounded-xl font-medium text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a0a0b0',
                    cursor: 'pointer',
                  }}
                >
                  Naar dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a0a0b0',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={16} /> Terug
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.company_name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                }}
              >
                Volgende <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                }}
              >
                {saving ? 'Opslaan...' : 'Opslaan & afronden'} <CheckCircle size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
