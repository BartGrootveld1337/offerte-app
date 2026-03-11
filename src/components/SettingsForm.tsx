'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Profile, Client } from '@/types'
import { Save, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsFormProps {
  profile: Profile | null
  clients: Client[]
  userId: string
}

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

const cardStyle: React.CSSProperties = {
  background: '#1e1e2a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
}

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)'
  e.target.style.borderColor = 'rgba(99,102,241,0.5)'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.boxShadow = 'none'
  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
}

interface FieldProps {
  label: string
  name: string
  type?: string
  half?: boolean
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
}

function Field({ label, name, type = 'text', half = false, value, onChange, placeholder }: FieldProps) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label style={labelStyle}>{label}</label>
      <input
        id={name}
        type={type}
        value={String(value)}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={inputStyle}
        onFocus={focusInput}
        onBlur={blurInput}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function SettingsForm({ profile, clients: initialClients, userId }: SettingsFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' })
  const [addingClient, setAddingClient] = useState(false)
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    company_name: profile?.company_name || '',
    company_address: profile?.company_address || '',
    company_city: profile?.company_city || '',
    company_postal: profile?.company_postal || '',
    company_email: profile?.company_email || '',
    company_phone: profile?.company_phone || '',
    company_website: profile?.company_website || '',
    company_kvk: profile?.company_kvk || '',
    company_btw: profile?.company_btw || '',
    company_iban: profile?.company_iban || '',
    default_payment_days: profile?.default_payment_days || 30,
    default_vat_rate: profile?.default_vat_rate || 21,
    default_intro: profile?.default_intro || '',
    default_footer: profile?.default_footer || '',
  })

  const set = (k: keyof typeof form) => (val: string | number) => setForm(f => ({ ...f, [k]: val }))

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...form, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) {
      toast.error('Fout bij opslaan: ' + error.message)
    } else {
      toast.success('Instellingen opgeslagen!')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/settings/logo', { method: 'POST', body: formData })
    if (res.ok) {
      const { url } = await res.json()
      setLogoUrl(url)
      toast.success('Logo geüpload!')
    } else {
      const err = await res.json()
      toast.error('Upload mislukt: ' + (err.error || 'Onbekende fout'))
    }
    setUploadingLogo(false)
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) { toast.error('Naam en e-mail zijn verplicht'); return }
    const { data, error } = await supabase.from('clients').insert({ ...newClient, user_id: userId }).select().single()
    if (error) { toast.error('Fout: ' + error.message); return }
    if (data) {
      setClients([...clients, data])
      setNewClient({ name: '', company: '', email: '', phone: '' })
      setAddingClient(false)
      toast.success('Klant toegevoegd')
    }
  }

  const handleDeleteClient = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id)
    setClients(clients.filter(c => c.id !== id))
    toast.success('Klant verwijderd')
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
    marginBottom: '16px',
  }

  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Bedrijfslogo</h2>
        <div className="flex items-center gap-6">
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl p-2" />
            ) : (
              <ImageIcon size={32} style={{ color: '#6b6b7a' }} />
            )}
          </div>
          <div>
            <p className="text-sm mb-3" style={{ color: '#a0a0b0' }}>
              Upload je bedrijfslogo. Wordt weergegeven op offertes en facturen.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} />
              {uploadingLogo ? 'Uploaden...' : 'Logo uploaden'}
            </button>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Bedrijfsgegevens</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrijfsnaam *" name="company_name" value={form.company_name} onChange={set('company_name')} placeholder="Vrijdag.AI" />
          <Field label="Adres" name="company_address" value={form.company_address} onChange={set('company_address')} placeholder="Straat 1" />
          <Field label="Postcode" name="company_postal" half value={form.company_postal} onChange={set('company_postal')} placeholder="1234 AB" />
          <Field label="Stad" name="company_city" half value={form.company_city} onChange={set('company_city')} placeholder="Amsterdam" />
          <Field label="KvK nummer" name="company_kvk" half value={form.company_kvk} onChange={set('company_kvk')} placeholder="12345678" />
          <Field label="BTW nummer" name="company_btw" half value={form.company_btw} onChange={set('company_btw')} placeholder="NL123456789B01" />
          <Field label="IBAN" name="company_iban" value={form.company_iban} onChange={set('company_iban')} placeholder="NL91 ABNA 0417 1643 00" />
        </div>
      </div>

      {/* Contact */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Contactgegevens</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="E-mailadres" name="company_email" type="email" half value={form.company_email} onChange={set('company_email')} placeholder="info@vrijdag.ai" />
          <Field label="Telefoonnummer" name="company_phone" half value={form.company_phone} onChange={set('company_phone')} placeholder="+31 6 12345678" />
          <Field label="Website" name="company_website" value={form.company_website} onChange={set('company_website')} placeholder="https://vrijdag.ai" />
        </div>
      </div>

      {/* Defaults */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Standaardinstellingen</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Betalingstermijn (dagen)" name="default_payment_days" type="number" half value={form.default_payment_days} onChange={set('default_payment_days')} placeholder="30" />
          <Field label="BTW-tarief (%)" name="default_vat_rate" type="number" half value={form.default_vat_rate} onChange={set('default_vat_rate')} placeholder="21" />
        </div>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Standaard introductietekst</label>
            <textarea
              value={form.default_intro}
              onChange={e => setForm(f => ({ ...f, default_intro: e.target.value }))}
              onFocus={focusInput}
              onBlur={blurInput}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Introductietekst die standaard op offertes staat..."
            />
          </div>
          <div>
            <label style={labelStyle}>Standaard slottekst</label>
            <textarea
              value={form.default_footer}
              onChange={e => setForm(f => ({ ...f, default_footer: e.target.value }))}
              onFocus={focusInput}
              onBlur={blurInput}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Slottekst die standaard op offertes staat..."
            />
          </div>
        </div>
      </div>

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
        <Save size={16} /> {saving ? 'Bezig...' : 'Opslaan'}
      </button>

      {/* Clients */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={sectionTitle}>Snelklanten</h2>
          <div className="flex gap-2">
            <a href="/clients" className="text-sm" style={{ color: '#818cf8' }}>Alle klanten →</a>
            <button
              onClick={() => setAddingClient(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Toevoegen
            </button>
          </div>
        </div>

        {addingClient && (
          <div
            className="rounded-xl p-4 mb-4 space-y-3"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Naam *', key: 'name', placeholder: 'Jan Janssen' },
                { label: 'Bedrijf', key: 'company', placeholder: 'Acme B.V.' },
                { label: 'E-mail *', key: 'email', placeholder: 'jan@acme.nl' },
                { label: 'Telefoon', key: 'phone', placeholder: '+31612345678' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>{label}</label>
                  <input
                    value={newClient[key as keyof typeof newClient]}
                    onChange={e => setNewClient({ ...newClient, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAddingClient(false)}
                className="px-3 py-1.5 text-sm rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a0a0b0', cursor: 'pointer' }}
              >
                Annuleren
              </button>
              <button
                onClick={handleAddClient}
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Toevoegen
              </button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {clients.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <p className="font-medium" style={{ color: '#ffffff' }}>{c.company || c.name}</p>
                {c.company && <p className="text-sm" style={{ color: '#a0a0b0' }}>{c.name}</p>}
                <p className="text-sm" style={{ color: '#6b6b7a' }}>{c.email}</p>
              </div>
              <button
                onClick={() => handleDeleteClient(c.id)}
                style={{ color: '#6b6b7a', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b6b7a')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {clients.length === 0 && !addingClient && (
            <p className="py-4 text-center text-sm" style={{ color: '#6b6b7a' }}>Nog geen klanten</p>
          )}
        </div>
      </div>
    </div>
  )
}
