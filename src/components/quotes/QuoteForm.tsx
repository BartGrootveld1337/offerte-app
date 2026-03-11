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

const inputStyle: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
  transition: 'box-shadow 0.15s',
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

const cardHeaderStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
  marginBottom: '16px',
}

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)'
  e.target.style.borderColor = 'rgba(99,102,241,0.5)'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.boxShadow = 'none'
  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
}

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

  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDescription, setAIDescription] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
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

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) { toast.error('Beschrijf eerst het project'); return }
    setAILoading(true)
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'AI generatie mislukt'); return }
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
    if (res.ok) toast.success('Template opgeslagen!')
    else toast.error('Fout bij opslaan template')
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

  const modalStyle: React.CSSProperties = {
    background: '#1a1a25',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a0a0b0',
          }}
        >
          <LayoutTemplate size={15} /> Laden uit template
        </button>
        <button
          onClick={saveAsTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a0a0b0',
          }}
        >
          <Save size={15} /> Opslaan als template
        </button>
        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
          }}
        >
          <Sparkles size={15} /> AI genereren
        </button>
      </div>

      {/* Header info */}
      <div style={cardStyle}>
        <h2 style={cardHeaderStyle}>Offertegegevens</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label style={labelStyle}>Offertenummer</label>
            <input
              value={formData.quote_number}
              onChange={e => setFormData({ ...formData, quote_number: e.target.value })}
              style={{ ...inputStyle, fontFamily: 'monospace' }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label style={labelStyle}>Titel</label>
            <input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label style={labelStyle}>Geldig tot</label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
        </div>
        <div className="mt-4">
          <label style={labelStyle}>Klant</label>
          <select
            value={formData.client_id}
            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
            style={{ ...inputStyle, paddingRight: '32px' }}
            onFocus={focusInput}
            onBlur={blurInput}
          >
            <option value="">— Selecteer een klant —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company || c.name} ({c.email})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Intro */}
      <div style={cardStyle}>
        <label style={{ ...labelStyle, ...cardHeaderStyle }}>Introductietekst</label>
        <textarea
          value={formData.intro}
          onChange={e => setFormData({ ...formData, intro: e.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
          onFocus={focusInput}
          onBlur={blurInput}
        />
      </div>

      {/* Items */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={cardHeaderStyle}>Offerteregels</h2>
          <button
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8',
            }}
          >
            <BookOpen size={14} /> Uit catalogus
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs font-semibold uppercase"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: '#6b6b7a',
                }}
              >
                <th className="pb-2 text-left">Omschrijving</th>
                <th className="pb-2 text-center w-20">Aantal</th>
                <th className="pb-2 text-center w-24">Eenheid</th>
                <th className="pb-2 text-right w-28">Prijs (excl.)</th>
                <th className="pb-2 text-center w-20">BTW%</th>
                <th className="pb-2 text-right w-28">Totaal</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-2 pr-3">
                    <input
                      value={item.description || ''}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Omschrijving"
                      style={{ ...inputStyle, padding: '6px 10px' }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value))}
                      style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      value={item.unit || ''}
                      onChange={e => updateItem(i, 'unit', e.target.value)}
                      style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price || ''}
                      onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value))}
                      style={{ ...inputStyle, padding: '6px 4px', textAlign: 'right' }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={item.vat_rate || defaultVat}
                      onChange={e => updateItem(i, 'vat_rate', parseFloat(e.target.value))}
                      style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    >
                      <option value={0}>0%</option>
                      <option value={9}>9%</option>
                      <option value={21}>21%</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 text-right font-medium" style={{ color: '#a0a0b0' }}>
                    {formatCurrency(Number(item.line_total) || 0)}
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeItem(i)}
                      className="transition-colors"
                      style={{ color: '#3a3a4a' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#3a3a4a')}
                    >
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
          className="mt-4 flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#6366f1' }}
        >
          <Plus size={16} /> Regel toevoegen
        </button>

        {/* Discounts */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#a0a0b0' }}>Kortingen (optioneel)</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#6b6b7a' }}>Korting % (op subtotaal)</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={formData.discount_percent || ''}
                  onChange={e => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  style={{ ...inputStyle, paddingRight: '28px' }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6b6b7a' }}>%</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#6b6b7a' }}>Korting bedrag (€)</label>
              <div className="relative">
                <input
                  type="number" min="0" step="0.01"
                  value={formData.discount_amount || ''}
                  onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  style={{ ...inputStyle, paddingLeft: '24px' }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6b6b7a' }}>€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 ml-auto w-80 space-y-2 text-sm">
          <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
            <span>Subtotaal (excl. BTW)</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount_total > 0 && (
            <div className="flex justify-between" style={{ color: '#f87171' }}>
              <span>Korting</span>
              <span className="font-medium">-{formatCurrency(totals.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between" style={{ color: '#a0a0b0' }}>
            <span>BTW</span>
            <span className="font-medium">{formatCurrency(totals.vat_amount)}</span>
          </div>
          <div
            className="flex justify-between font-bold text-base pt-2"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
            }}
          >
            <span>Totaal</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={cardStyle}>
        <label style={{ ...labelStyle, ...cardHeaderStyle }}>Slottekst / voorwaarden</label>
        <textarea
          value={formData.footer}
          onChange={e => setFormData({ ...formData, footer: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
          onFocus={focusInput}
          onBlur={blurInput}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-xl font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a0a0b0',
          }}
        >
          Annuleren
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a0a0b0',
            }}
          >
            <Save size={16} /> Opslaan als concept
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Opslaan & versturen
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-lg" style={modalStyle}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                  >
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                      AI Offerte Generator
                    </h2>
                    <p className="text-xs" style={{ color: '#6b6b7a' }}>Beschrijf je project in het Nederlands</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  style={{ color: '#6b6b7a' }}
                >
                  <X size={20} />
                </button>
              </div>

              <textarea
                value={aiDescription}
                onChange={e => setAIDescription(e.target.value)}
                rows={6}
                placeholder="Beschrijf het project waarvoor je een offerte wilt maken..."
                style={{ ...inputStyle, resize: 'none', marginBottom: '16px', lineHeight: '1.6' }}
                onFocus={focusInput}
                onBlur={blurInput}
                disabled={aiLoading}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a0a0b0',
                  }}
                  disabled={aiLoading}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiDescription.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                  }}
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
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-2xl flex flex-col max-h-[80vh]" style={{ ...modalStyle, padding: 0 }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>Catalogus</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6b6b7a' }}>Klik op een item om het toe te voegen</p>
              </div>
              <button onClick={() => setShowCatalogModal(false)} style={{ color: '#6b6b7a' }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Zoeken in catalogus..."
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {catalogItems.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} className="mx-auto mb-3" style={{ color: '#2a2a3a' }} />
                  <p className="font-medium" style={{ color: '#6b6b7a' }}>Geen items in de catalogus</p>
                  <a href="/catalog" className="text-sm mt-2 inline-block" style={{ color: '#6366f1' }}>Voeg items toe →</a>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#6b6b7a' }}>Geen resultaten</p>
              ) : (
                <div className="space-y-1">
                  {categories.map(cat => {
                    const catItems = filteredCatalog.filter(i => i.category === cat)
                    if (!catItems.length) return null
                    return (
                      <div key={cat}>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider px-2 mb-1 mt-4"
                          style={{ color: '#6b6b7a' }}
                        >
                          {cat}
                        </p>
                        {catItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { addCatalogItem(item); setShowCatalogModal(false) }}
                            className="w-full text-left flex items-center justify-between p-3 rounded-xl transition-all"
                            style={{ border: '1px solid transparent' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{item.name}</p>
                              {item.description && <p className="text-xs mt-0.5" style={{ color: '#6b6b7a' }}>{item.description}</p>}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <p className="font-bold text-sm" style={{ color: '#818cf8' }}>{formatCurrency(item.unit_price)}</p>
                              <p className="text-xs" style={{ color: '#6b6b7a' }}>per {item.unit} · {item.vat_rate}% BTW</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                  {filteredCatalog.filter(i => !i.category).map(item => (
                    <button
                      key={item.id}
                      onClick={() => { addCatalogItem(item); setShowCatalogModal(false) }}
                      className="w-full text-left flex items-center justify-between p-3 rounded-xl transition-all"
                      style={{ border: '1px solid transparent' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{item.name}</p>
                        {item.description && <p className="text-xs mt-0.5" style={{ color: '#6b6b7a' }}>{item.description}</p>}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-sm" style={{ color: '#818cf8' }}>{formatCurrency(item.unit_price)}</p>
                        <p className="text-xs" style={{ color: '#6b6b7a' }}>per {item.unit} · {item.vat_rate}% BTW</p>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md" style={{ ...modalStyle, padding: 0 }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>
                Templates laden
              </h2>
              <button onClick={() => setShowTemplateModal(false)} style={{ color: '#6b6b7a' }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutTemplate size={32} className="mx-auto mb-3" style={{ color: '#2a2a3a' }} />
                  <p className="font-medium" style={{ color: '#6b6b7a' }}>Nog geen templates</p>
                  <p className="text-sm mt-1" style={{ color: '#6b6b7a' }}>Sla de huidige offerte op als template</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left p-4 rounded-xl transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <p className="font-semibold" style={{ color: '#ffffff' }}>{t.name}</p>
                      {t.title && <p className="text-sm mt-0.5" style={{ color: '#a0a0b0' }}>{t.title}</p>}
                      <p className="text-xs mt-1" style={{ color: '#6b6b7a' }}>{Array.isArray(t.items) ? t.items.length : 0} regel(s)</p>
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
