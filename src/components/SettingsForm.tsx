'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Profile, Client } from '@/types'
import { Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsFormProps {
  profile: Profile | null
  clients: Client[]
  userId: string
}

interface FieldProps {
  label: string
  name: string
  type?: string
  half?: boolean
  value: string | number
  onChange: (value: string | number) => void
}

const Field = ({ label, name, type = 'text', half = false, value, onChange }: FieldProps) => (
  <div className={half ? 'col-span-1' : 'col-span-2'}>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={String(value)}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
)

export default function SettingsForm({ profile, clients: initialClients, userId }: SettingsFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' })
  const [addingClient, setAddingClient] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Company info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Bedrijfsgegevens</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrijfsnaam" name="company_name" value={form.company_name} onChange={(val) => setForm({ ...form, company_name: val as string })} />
          <Field label="Adres" name="company_address" value={form.company_address} onChange={(val) => setForm({ ...form, company_address: val as string })} />
          <Field label="Postcode" name="company_postal" half value={form.company_postal} onChange={(val) => setForm({ ...form, company_postal: val as string })} />
          <Field label="Stad" name="company_city" half value={form.company_city} onChange={(val) => setForm({ ...form, company_city: val as string })} />
          <Field label="E-mail" name="company_email" type="email" half value={form.company_email} onChange={(val) => setForm({ ...form, company_email: val as string })} />
          <Field label="Telefoon" name="company_phone" half value={form.company_phone} onChange={(val) => setForm({ ...form, company_phone: val as string })} />
          <Field label="Website" name="company_website" half value={form.company_website} onChange={(val) => setForm({ ...form, company_website: val as string })} />
          <Field label="KVK-nummer" name="company_kvk" half value={form.company_kvk} onChange={(val) => setForm({ ...form, company_kvk: val as string })} />
          <Field label="BTW-nummer" name="company_btw" half value={form.company_btw} onChange={(val) => setForm({ ...form, company_btw: val as string })} />
          <Field label="IBAN" name="company_iban" half value={form.company_iban} onChange={(val) => setForm({ ...form, company_iban: val as string })} />
        </div>
      </div>

      {/* Defaults */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Standaardinstellingen</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Standaard betalingstermijn (dagen)" name="default_payment_days" type="number" half value={form.default_payment_days} onChange={(val) => setForm({ ...form, default_payment_days: val as number })} />
          <Field label="Standaard BTW-tarief (%)" name="default_vat_rate" type="number" half value={form.default_vat_rate} onChange={(val) => setForm({ ...form, default_vat_rate: val as number })} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Standaard introductietekst</label>
            <textarea
              value={form.default_intro}
              onChange={e => setForm({ ...form, default_intro: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Standaard slottekst</label>
            <textarea
              value={form.default_footer}
              onChange={e => setForm({ ...form, default_footer: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        <Save size={16} /> {saving ? 'Bezig...' : 'Opslaan'}
      </button>

      {/* Clients */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Snelklanten</h2>
          <div className="flex gap-2">
            <a href="/clients" className="text-sm text-blue-600 hover:underline">Alle klanten beheren →</a>
            <button
              onClick={() => setAddingClient(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors"
            >
              <Plus size={14} /> Toevoegen
            </button>
          </div>
        </div>

        {addingClient && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Naam', key: 'name', placeholder: 'Jan Janssen' },
                { label: 'Bedrijf', key: 'company', placeholder: 'Acme B.V.' },
                { label: 'E-mail', key: 'email', placeholder: 'jan@acme.nl' },
                { label: 'Telefoon', key: 'phone', placeholder: '+31612345678' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    value={newClient[key as keyof typeof newClient]}
                    onChange={e => setNewClient({ ...newClient, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingClient(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuleren</button>
              <button onClick={handleAddClient} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Toevoegen</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {clients.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{c.company || c.name}</p>
                {c.company && <p className="text-sm text-slate-500">{c.name}</p>}
                <p className="text-sm text-slate-500">{c.email}</p>
              </div>
              <button onClick={() => handleDeleteClient(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {clients.length === 0 && !addingClient && (
            <p className="text-slate-400 text-sm py-4 text-center">Nog geen klanten toegevoegd</p>
          )}
        </div>
      </div>
    </div>
  )
}
