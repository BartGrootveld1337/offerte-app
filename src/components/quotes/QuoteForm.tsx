'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { calculateTotals, formatCurrency } from '@/lib/utils'
import type { Quote, QuoteItem, Client, CatalogItem, QuoteTemplate } from '@/types'
import { Plus, Trash2, Save, Send, Sparkles, BookOpen, LayoutTemplate, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface QuoteFormProps {
  quote?: Quote & { quote_items?: QuoteItem[] }
  clients: Client[]
  catalogItems: CatalogItem[]
  templates: QuoteTemplate[]
  defaultVat: number
  defaultIntro: string
  defaultFooter: string
  nextNumber: string
}

type FormItem = Partial<QuoteItem>

export default function QuoteForm({
  quote,
  clients,
  catalogItems,
  templates,
  defaultVat,
  defaultIntro,
  defaultFooter,
  nextNumber,
}: QuoteFormProps) {
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
    discount_percent: quote?.discount_percent || 0,
    discount_amount: quote?.discount_amount || 0,
  })

  const [items, setItems] = useState<FormItem[]>(
    quote?.quote_items?.length
      ? quote.quote_items
      : [{ description: '', quantity: 1, unit: 'stuks', unit_price: 0, vat_rate: defaultVat, line_total: 0 }]
  )

  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDescription, setAIDescription] = useState('')
  const [aiLoading, setAILoading] = useState(false)

  // Catalog Modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')

  // Template Modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const totals = calculateTotals(
    items.map(i => ({
      quantity: Number(i.quantity) || 0,
      unit_price: Number(i.unit_price) || 0,
      vat_rate: Number(i.vat_rate) || 0,
    })),
    Number(formData.discount_percent) || 0,
    Number(formData.discount_amount) || 0
  )

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

  // AI generation
  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) {
      toast.error('Beschrijf eerst het project')
      return
    }
    setAILoading(true)
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'AI generatie mislukt')
        return
      }

      // Apply to form
      if (data.title) setFormData(f => ({ ...f, title: data.title }))
      if (data.intro) setFormData(f => ({ ...f, intro: data.intro }))
      if (data.line_items?.length) {
        setItems(data.line_items.map((item: { description: string; quantity: number; unit: string; unit_price: number; vat_rate: number }) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unit: item.unit || 'stuks',
          unit_price: item.unit_price || 0,
          vat_rate: item.vat_rate || 21,
          line_total: (item.quantity || 1) * (item.unit_price || 0),
        })))
      }

      setShowAIModal(false)
      setAIDescription('')
      toast.success('Offerte gegenereerd door AI!')
    } catch {
      toast.error('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setAILoading(false)
    }
  }

  // Add catalog item to quote
  const addCatalogItem = (item: CatalogItem) => {
    setItems(prev => [
      ...prev,
      {
        description: `${item.name}${item.description ? ` — ${item.description}` : ''}`,
        quantity: 1,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        line_total: item.unit_price,
      },
    ])
    toast.success(`"${item.name}" toegevoegd`)
  }

  // Load template
  const loadTemplate = (template: QuoteTemplate) => {
    setFormData(f => ({
      ...f,
      title: template.title || f.title,
      intro: template.intro || f.intro,
      footer: template.footer || f.footer,
    }))
    if (template.items?.length) {
      setItems(template.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        line_total: item.quantity * item.unit_price,
      })))
    }
    setShowTemplateModal(false)
    toast.success(`Template "${template.name}" geladen`)
  }

  // Save as template
  const saveAsTemplate = async () => {
    const name = prompt('Naam voor dit template:')
    if (!name) return
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        title: formData.title,
        intro: formData.intro,
        footer: formData.footer,
        items: items.map(i => ({
          description: i.description || '',
          quantity: Number(i.quantity) || 1,
          unit: i.unit || 'stuks',
          unit_price: Number(i.unit_price) || 0,
          vat_rate: Number(i.vat_rate) || 21,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Template opgeslagen!')
    } else {
      toast.error('Fout bij opslaan template')
    }
  }

  const handleSave = async (sendAfter = false) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quoteData = {
      ...formData,
      user_id: user.id,
      client_id: formData.client_id || null,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
      discount_percent: Number(formData.discount_percent) || 0,
      discount_amount: Number(formData.discount_amount) || 0,
      status: quote?.status || 'draft',
      updated_at: new Date().toISOString(),
    }

    let quoteId = quote?.id

    if (quote) {
      const { error } = await supabase.from('quotes').update(quoteData).eq('id', quote.id)
      if (error) { toast.error('Fout bij opslaan: ' + error.message); setSaving(false); return }
      await supabase.from('quote_items').delete().eq('quote_id', quote.id)
    } else {
      const { data, error } = await supabase.from('quotes').insert(quoteData).select().single()
      if (error) { toast.error('Fout bij aanmaken: ' + error.message); setSaving(false); return }
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

    toast.success(quote ? 'Offerte bijgewerkt!' : 'Offerte aangemaakt!')
    setSaving(false)
    if (sendAfter && quoteId) {
      router.push(`/quotes/${quoteId}?action=send`)
    } else {
      router.push(quoteId ? `/quotes/${quoteId}` : '/dashboard')
    }
  }

  const filteredCatalog = catalogItems.filter(item =>
    `${item.name} ${item.category || ''} ${item.description || ''}`.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  const categories = [...new Set(catalogItems.map(i => i.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <LayoutTemplate size={15} /> Laden uit template
        </button>
        <button
          onClick={saveAsTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <Save size={15} /> Opslaan als template
        </button>
        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles size={15} /> AI genereren
        </button>
      </div>

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Offerteregels</h2>
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            <BookOpen size={14} /> Uit catalogus
          </button>
        </div>
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

        {/* Discounts */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Kortingen (optioneel)</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Korting % (op subtotaal)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.discount_percent || ''}
                  onChange={e => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Korting bedrag (€)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount || ''}
                  onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 ml-auto w-80 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotaal (excl. BTW)</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount_total > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Korting</span>
              <span className="font-medium">-{formatCurrency(totals.discount_total)}</span>
            </div>
          )}
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
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Opslaan & versturen
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Offerte Generator</h2>
                  <p className="text-xs text-slate-500">Beschrijf je project in het Nederlands</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <textarea
              value={aiDescription}
              onChange={e => setAIDescription(e.target.value)}
              rows={6}
              placeholder="Beschrijf het project waarvoor je een offerte wilt maken. Bijv: 'Ontwikkeling van een AI-powered klantenservice chatbot voor een webshop. Inclusief integratie met bestaand CRM-systeem, training op productcatalogus, en 3 maanden ondersteuning.'"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none mb-4"
              disabled={aiLoading}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                disabled={aiLoading}
              >
                Annuleren
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiDescription.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Genereren...</>
                ) : (
                  <><Sparkles size={16} /> Genereer offerte</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Catalogus</h2>
                <p className="text-xs text-slate-500 mt-0.5">Klik op een item om het toe te voegen</p>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <input
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Zoeken in catalogus..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {catalogItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Geen items in de catalogus</p>
                  <a href="/catalog" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Voeg items toe →</a>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Geen resultaten</p>
              ) : (
                <div className="space-y-2">
                  {categories.map(cat => {
                    const catItems = filteredCatalog.filter(i => i.category === cat)
                    if (!catItems.length) return null
                    return (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 mt-3">{cat}</p>
                        {catItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { addCatalogItem(item); setShowCatalogModal(false) }}
                            className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all"
                          >
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                              {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <p className="font-bold text-slate-900 text-sm">{formatCurrency(item.unit_price)}</p>
                              <p className="text-xs text-slate-400">per {item.unit} · {item.vat_rate}% BTW</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                  {/* Uncategorized */}
                  {filteredCatalog.filter(i => !i.category).map(item => (
                    <button
                      key={item.id}
                      onClick={() => { addCatalogItem(item); setShowCatalogModal(false) }}
                      className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all"
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(item.unit_price)}</p>
                        <p className="text-xs text-slate-400">per {item.unit} · {item.vat_rate}% BTW</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Templates laden</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <LayoutTemplate size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Nog geen templates</p>
                  <p className="text-sm mt-1">Sla de huidige offerte op als template</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      {t.title && <p className="text-sm text-slate-500 mt-0.5">{t.title}</p>}
                      <p className="text-xs text-slate-400 mt-1">{Array.isArray(t.items) ? t.items.length : 0} regel(s)</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
