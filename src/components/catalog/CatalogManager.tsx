'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { CatalogItem } from '@/types'
import { Plus, Trash2, Edit2, Save, X, BookOpen, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  initialItems: CatalogItem[]
}

const emptyItem = (): Partial<CatalogItem> => ({
  name: '',
  description: '',
  unit: 'stuks',
  unit_price: 0,
  vat_rate: 21,
  category: '',
})

export default function CatalogManager({ initialItems }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<CatalogItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [form, setForm] = useState<Partial<CatalogItem>>(emptyItem())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const filtered = items.filter(item =>
    `${item.name} ${item.category || ''} ${item.description || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditing(null)
    setForm(emptyItem())
    setShowForm(true)
  }

  const openEdit = (item: CatalogItem) => {
    setEditing(item)
    setForm({ ...item })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Naam is verplicht'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      name: form.name!,
      description: form.description || null,
      unit: form.unit || 'stuks',
      unit_price: Number(form.unit_price) || 0,
      vat_rate: Number(form.vat_rate) || 21,
      category: form.category || null,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      const { data, error } = await supabase
        .from('catalog_items')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (error) { toast.error('Fout bij bijwerken'); setSaving(false); return }
      setItems(prev => prev.map(i => i.id === editing.id ? data : i))
      toast.success('Item bijgewerkt')
    } else {
      const { data, error } = await supabase
        .from('catalog_items')
        .insert(payload)
        .select()
        .single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setItems(prev => [...prev, data])
      toast.success('Item toegevoegd aan catalogus')
    }

    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id)
    if (error) { toast.error('Fout bij verwijderen'); return }
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleteConfirm(null)
    toast.success('Item verwijderd')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            Product & Diensten Catalogus
          </h1>
          <p className="text-slate-500 mt-1">Beheer je standaard diensten en producten voor snelle offertes</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          <Plus size={18} /> Nieuw item
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoeken in catalogus..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Lege catalogus</h3>
          <p className="text-slate-500 mb-6">Voeg je standaard diensten en producten toe om snel offertes te kunnen opstellen.</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            <Plus size={16} /> Eerste item toevoegen
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>Geen resultaten voor &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group by category */}
          {categories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat)
            if (!catItems.length) return null
            return (
              <div key={cat}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catItems.map(item => (
                    <CatalogCard
                      key={item.id}
                      item={item}
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteConfirm(item.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Uncategorized */}
          {filtered.filter(i => !i.category).length > 0 && (
            <div>
              {categories.length > 0 && (
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Overig</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.filter(i => !i.category).map(item => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => setDeleteConfirm(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? 'Item bewerken' : 'Nieuw item'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Naam *</label>
                  <input
                    value={form.name || ''}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Naam van het product of dienst"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschrijving</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Korte omschrijving (optioneel)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                  <input
                    value={form.category || ''}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Bijv. Consultancy"
                    list="categories"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="categories">
                    {categories.map(c => <option key={c} value={c || ''} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Eenheid</label>
                  <input
                    value={form.unit || ''}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    list="units"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="units">
                    <option value="stuks" />
                    <option value="uur" />
                    <option value="dag" />
                    <option value="maand" />
                    <option value="project" />
                    <option value="licentie" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prijs (excl. BTW)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.unit_price || ''}
                      onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BTW-tarief</label>
                  <select
                    value={form.vat_rate || 21}
                    onChange={e => setForm({ ...form, vat_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>0%</option>
                    <option value={9}>9%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Item verwijderen?</h3>
            <p className="text-slate-500 text-sm mb-6">Dit kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogCard({ item, onEdit, onDelete }: {
  item: CatalogItem
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{item.name}</p>
          {item.description && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{item.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="font-bold text-slate-900">{formatCurrency(item.unit_price)}</span>
            <span className="text-xs text-slate-400">per {item.unit}</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.vat_rate}% BTW</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
