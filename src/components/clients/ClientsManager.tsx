'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { Client } from '@/types'
import { Plus, Trash2, Edit2, Save, X, Users, Search, Building2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClientQuote {
  client_id: string | null
  total: number
  status: string
}

interface Props {
  initialClients: Client[]
  quotes: ClientQuote[]
}

const emptyClient = (): Partial<Client> => ({
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal: '',
  country: 'Nederland',
  notes: '',
})

export default function ClientsManager({ initialClients, quotes }: Props) {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>(emptyClient())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const getClientStats = (clientId: string) => {
    const clientQuotes = quotes.filter(q => q.client_id === clientId)
    const total = clientQuotes.reduce((sum, q) => sum + (q.total || 0), 0)
    const signed = clientQuotes.filter(q => q.status === 'signed').length
    return { count: clientQuotes.length, total, signed }
  }

  const filtered = clients.filter(c =>
    `${c.name} ${c.company || ''} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditing(null)
    setForm(emptyClient())
    setShowForm(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({ ...client })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Naam is verplicht'); return }
    if (!form.email?.trim()) { toast.error('E-mailadres is verplicht'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      name: form.name!,
      company: form.company || null,
      email: form.email!,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      postal: form.postal || null,
      country: form.country || 'Nederland',
      notes: form.notes || null,
      user_id: user.id,
    }

    if (editing) {
      const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (error) { toast.error('Fout bij bijwerken'); setSaving(false); return }
      setClients(prev => prev.map(c => c.id === editing.id ? data : c))
      toast.success('Klant bijgewerkt')
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setClients(prev => [...prev, data])
      toast.success('Klant toegevoegd')
    }

    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { toast.error('Fout bij verwijderen'); return }
    setClients(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
    toast.success('Klant verwijderd')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-indigo-400" />
            Klanten
          </h1>
          <p className="text-[#6b6b7a] mt-1">{clients.length} klant{clients.length !== 1 ? 'en' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white font-bold rounded-xl transition-colors"
        >
          <Plus size={18} /> Nieuwe klant
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b7a]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoeken op naam, bedrijf of e-mail..."
          className="w-full pl-10 pr-4 py-2.5 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#1e1e2a]"
        />
      </div>

      {clients.length === 0 ? (
        <div className="bg-[#1e1e2a] rounded-2xl p-16 text-center shadow-sm border border-white/6">
          <Users size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-white mb-2">Nog geen klanten</h3>
          <p className="text-[#6b6b7a] mb-6">Voeg je eerste klant toe om offertes te kunnen sturen.</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white font-bold rounded-xl"
          >
            <Plus size={16} /> Eerste klant toevoegen
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6b6b7a]">
          <p>Geen klanten gevonden voor &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(client => {
            const stats = getClientStats(client.id)
            return (
              <div key={client.id} className="bg-[#1e1e2a] rounded-2xl border border-white/8 p-5 hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-400">
                      {(client.company || client.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {client.company && <p className="font-bold text-white leading-tight">{client.company}</p>}
                      <p className={client.company ? 'text-sm text-[#6b6b7a]' : 'font-bold text-white'}>{client.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(client)} className="p-1.5 text-[#6b6b7a] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm(client.id)} className="p-1.5 text-[#6b6b7a] hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#a0a0b0]">
                    <Mail size={13} className="text-[#6b6b7a]" />
                    <a href={`mailto:${client.email}`} className="hover:text-indigo-400">{client.email}</a>
                  </div>
                  {client.city && (
                    <div className="flex items-center gap-2 text-sm text-[#6b6b7a]">
                      <Building2 size={13} className="text-[#6b6b7a]" />
                      {client.city}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-3 border-t border-white/6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{stats.count}</p>
                    <p className="text-xs text-[#6b6b7a]">Offertes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{stats.signed}</p>
                    <p className="text-xs text-[#6b6b7a]">Getekend</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-lg font-bold text-white">{formatCurrency(stats.total)}</p>
                    <p className="text-xs text-[#6b6b7a]">Totaalwaarde</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2a] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Klant bewerken' : 'Nieuwe klant'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#6b6b7a] hover:text-[#a0a0b0]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Contactpersoon *</label>
                  <input
                    value={form.name || ''}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Voornaam Achternaam"
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Bedrijfsnaam</label>
                  <input
                    value={form.company || ''}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    placeholder="Bedrijfsnaam B.V."
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">E-mailadres *</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="naam@bedrijf.nl"
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Telefoonnummer</label>
                  <input
                    value={form.phone || ''}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+31 6 ..."
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Postcode</label>
                  <input
                    value={form.postal || ''}
                    onChange={e => setForm({ ...form, postal: e.target.value })}
                    placeholder="1234 AB"
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Adres</label>
                  <input
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Straatnaam 1"
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Stad</label>
                  <input
                    value={form.city || ''}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Amsterdam"
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#a0a0b0] mb-1">Notities</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Interne notities over deze klant..."
                    className="w-full px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-white/8 rounded-xl text-[#a0a0b0] hover:bg-[#12121a] font-medium">
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 btn-gradient text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={15} />
                {saving ? 'Opslaan...' : editing ? 'Bijwerken' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2a] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Klant verwijderen?</h3>
            <p className="text-[#6b6b7a] text-sm mb-6">Dit verwijdert de klant maar niet de bijbehorende offertes.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-white/8 rounded-xl text-[#a0a0b0] font-medium">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
