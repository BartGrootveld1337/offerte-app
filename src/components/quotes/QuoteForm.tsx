'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { calculateTotals, formatCurrency } from '@/lib/utils'
import type { Quote, QuoteItem, Client } from '@/types'
import { Plus, Trash2, Save, Send } from 'lucide-react'

interface QuoteFormProps {
  quote?: Quote & { quote_items?: QuoteItem[] }
  clients: Client[]
  defaultVat: number
  defaultIntro: string
  defaultFooter: string
  nextNumber: string
}

export default function QuoteForm({ quote, clients, defaultVat, defaultIntro, defaultFooter, nextNumber }: QuoteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    quote_number: quote?.quote_number || nextNumber,
    title: quote?.title || 'Offerte',
    client_id: quote?.client_id || '',
    intro: quote?.intro || defaultIntro,
    footer: quote?.footer || defaultFooter,
    valid_until: quote?.valid_until || '',
    notes: quote?.notes || '',
  })

  const [items, setItems] = useState<Partial<QuoteItem>[]>(
    quote?.quote_items?.length
      ? quote.quote_items
      : [{ description: '', quantity: 1, unit: 'stuks', unit_price: 0, vat_rate: defaultVat, line_total: 0 }]
  )

  const totals = calculateTotals(items.map(i => ({
    quantity: Number(i.quantity) || 0,
    unit_price: Number(i.unit_price) || 0,
    vat_rate: Number(i.vat_rate) || 0,
  })))

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    const q = Number(updated[index].quantity) || 0
    const p = Number(updated[index].unit_price) || 0
    updated[index].line_total = q * p
    setItems(updated)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'stuks', unit_price: 0, vat_rate: defaultVat, line_total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = async (sendAfter = false) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quoteData = {
      ...formData,
      user_id: user.id,
      client_id: formData.client_id || null,
      ...totals,
      status: quote?.status || 'draft',
    }

    let quoteId = quote?.id

    if (quote) {
      await supabase.from('quotes').update(quoteData).eq('id', quote.id)
      await supabase.from('quote_items').delete().eq('quote_id', quote.id)
    } else {
      const { data } = await supabase.from('quotes').insert(quoteData).select().single()
      quoteId = data?.id
    }

    if (quoteId) {
      const itemsData = items.map((item, i) => ({
        quote_id: quoteId,
        sort_order: i,
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'stuks',
        unit_price: Number(item.unit_price) || 0,
        vat_rate: Number(item.vat_rate) || defaultVat,
        line_total: Number(item.line_total) || 0,
      }))
      await supabase.from('quote_items').insert(itemsData)
    }

    setSaving(false)
    if (sendAfter && quoteId) {
      router.push(`/quotes/${quoteId}?action=send`)
    } else {
      router.push(quoteId ? `/quotes/${quoteId}` : '/dashboard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Offertegegevens</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Offertenummer</label>
            <input
              value={formData.quote_number}
              onChange={e => setFormData({ ...formData, quote_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titel</label>
            <input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Geldig tot</label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Klant</label>
          <select
            value={formData.client_id}
            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selecteer een klant —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company || c.name} ({c.email})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 mb-2">Introductietekst</label>
        <textarea
          value={formData.intro}
          onChange={e => setFormData({ ...formData, intro: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Offerteregels</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <th className="pb-2 text-left">Omschrijving</th>
                <th className="pb-2 text-center w-20">Aantal</th>
                <th className="pb-2 text-center w-24">Eenheid</th>
                <th className="pb-2 text-right w-28">Prijs (excl.)</th>
                <th className="pb-2 text-center w-20">BTW%</th>
                <th className="pb-2 text-right w-28">Totaal</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3">
                    <input
                      value={item.description || ''}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Omschrijving van de dienst of het product"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value))}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      value={item.unit || ''}
                      onChange={e => updateItem(i, 'unit', e.target.value)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price || ''}
                      onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={item.vat_rate || defaultVat}
                      onChange={e => updateItem(i, 'vat_rate', parseFloat(e.target.value))}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>0%</option>
                      <option value={9}>9%</option>
                      <option value={21}>21%</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 text-right font-medium text-slate-700">
                    {formatCurrency(Number(item.line_total) || 0)}
                  </td>
                  <td className="py-2 pl-2">
                    <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> Regel toevoegen
        </button>

        {/* Totals */}
        <div className="mt-6 ml-auto w-72 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotaal (excl. BTW)</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>BTW</span>
            <span className="font-medium">{formatCurrency(totals.vat_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2">
            <span>Totaal</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 mb-2">Slottekst / voorwaarden</label>
        <textarea
          value={formData.footer}
          onChange={e => setFormData({ ...formData, footer: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
        >
          Annuleren
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} /> Opslaan als concept
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={16} /> Opslaan & versturen
          </button>
        </div>
      </div>
    </div>
  )
}
