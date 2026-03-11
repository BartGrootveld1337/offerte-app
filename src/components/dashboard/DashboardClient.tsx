'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, statusLabel } from '@/lib/utils'
import { Plus, FileText, TrendingUp, Clock, CheckCircle, Eye, Search, Filter, PercentCircle, BarChart3, Timer } from 'lucide-react'
import type { Quote, QuoteStatus } from '@/types'

interface Props {
  quotes: Quote[]
  openedIds: string[]
}

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'sent':
      return { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
    case 'signed':
      return { background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }
    case 'draft':
      return { background: 'rgba(107,107,122,0.15)', color: '#a0a0b0', border: '1px solid rgba(107,107,122,0.25)' }
    case 'expired':
      return { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
    case 'declined':
      return { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
    default:
      return { background: 'rgba(107,107,122,0.15)', color: '#a0a0b0' }
  }
}

export default function DashboardClient({ quotes, openedIds }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  const openedSet = new Set(openedIds)

  const totalOpen = quotes.filter(q => q.status === 'sent').reduce((s, q) => s + q.total, 0)
  const totalSigned = quotes.filter(q => q.status === 'signed').reduce((s, q) => s + q.total, 0)
  const countDraft = quotes.filter(q => q.status === 'draft').length
  const countSent = quotes.filter(q => q.status === 'sent').length
  const countSigned = quotes.filter(q => q.status === 'signed').length
  const countDeclined = quotes.filter(q => q.status === 'declined').length

  const countExpired = quotes.filter(q => q.status === 'expired').length
  const decidedCount = countSigned + countDeclined + countExpired
  const conversionRate = decidedCount > 0 ? Math.round((countSigned / decidedCount) * 100) : 0

  // Average quote value (signed)
  const signedQuotes = quotes.filter(q => q.status === 'signed')
  const avgSignedValue = signedQuotes.length > 0 ? totalSigned / signedQuotes.length : 0

  // Average signing time (signed_at - sent_at in days)
  const signingTimes = signedQuotes
    .filter(q => q.signed_at && q.sent_at)
    .map(q => (new Date(q.signed_at!).getTime() - new Date(q.sent_at!).getTime()) / (1000 * 60 * 60 * 24))
  const avgSigningDays = signingTimes.length > 0
    ? Math.round(signingTimes.reduce((a, b) => a + b, 0) / signingTimes.length)
    : 0

  const filtered = quotes.filter(q => {
    const matchSearch = search
      ? `${q.quote_number} ${q.title} ${q.clients?.name || ''} ${q.clients?.company || ''}`.toLowerCase().includes(search.toLowerCase())
      : true
    const matchStatus = statusFilter === 'all' ? true : q.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
              color: '#ffffff',
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: '#6b6b7a', fontSize: '14px' }}>Overzicht van je offertes</p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
          }}
        >
          <Plus size={18} />
          Nieuwe offerte
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <StatCard
          label="Openstaand"
          value={formatCurrency(totalOpen)}
          icon={Clock}
          gradient="linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))"
          iconColor="#818cf8"
          iconBg="rgba(99,102,241,0.15)"
        />
        <StatCard
          label="Ondertekend"
          value={formatCurrency(totalSigned)}
          icon={CheckCircle}
          gradient="linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.03))"
          iconColor="#22d3ee"
          iconBg="rgba(34,211,238,0.12)"
        />
        <StatCard
          label="Concepten"
          value={String(countDraft)}
          icon={FileText}
          gradient="linear-gradient(135deg, rgba(107,107,122,0.2), rgba(107,107,122,0.05))"
          iconColor="#a0a0b0"
          iconBg="rgba(107,107,122,0.15)"
        />
        <StatCard
          label="Verstuurd"
          value={String(countSent)}
          icon={TrendingUp}
          gradient="linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))"
          iconColor="#a855f7"
          iconBg="rgba(168,85,247,0.15)"
        />
        <StatCard
          label="Conversie"
          value={`${conversionRate}%`}
          icon={PercentCircle}
          gradient="linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))"
          iconColor="#818cf8"
          iconBg="rgba(99,102,241,0.15)"
          subtitle={`${countSigned} van ${decidedCount} besloten`}
        />
        {avgSignedValue > 0 && (
          <StatCard
            label="Gem. offertewaarde"
            value={formatCurrency(avgSignedValue)}
            icon={BarChart3}
            gradient="linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.03))"
            iconColor="#22d3ee"
            iconBg="rgba(34,211,238,0.12)"
          />
        )}
        {avgSigningDays > 0 && (
          <StatCard
            label="Gem. ondertekentijd"
            value={`${avgSigningDays} dag${avgSigningDays !== 1 ? 'en' : ''}`}
            icon={Timer}
            gradient="linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))"
            iconColor="#c084fc"
            iconBg="rgba(168,85,247,0.15)"
          />
        )}
      </div>

      {/* Quotes table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#1e1e2a',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="p-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2
              className="text-lg font-bold"
              style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
            >
              Alle offertes
            </h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#6b6b7a' }}
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Zoeken..."
                  className="pl-9 pr-4 py-2 rounded-xl text-sm w-44"
                  style={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.3)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              {/* Status filter */}
              <div className="relative">
                <Filter
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#6b6b7a' }}
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'all')}
                  className="pl-9 pr-4 py-2 rounded-xl text-sm appearance-none"
                  style={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="all">Alle statussen</option>
                  <option value="draft">Concept</option>
                  <option value="sent">Verstuurd</option>
                  <option value="signed">Ondertekend</option>
                  <option value="declined">Afgewezen</option>
                  <option value="expired">Verlopen</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <img src="/vrijdag_ai_logo.svg" alt="Vrijdag.AI" style={{ height: '48px', opacity: 0.4 }} />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
            >
              Je eerste offerte staat te wachten
            </h3>
            <p className="mb-6" style={{ color: '#6b6b7a' }}>
              Maak professionele offertes en stuur ze direct naar je klanten.
            </p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: 'white',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={18} /> Maak je eerste offerte →
            </Link>
            <div
              className="mt-8 text-left rounded-xl p-4 inline-block min-w-64"
              style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b6b7a' }}>Snelstart</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: '#22d3ee' }}>✅</span>
                  <span style={{ color: '#a0a0b0' }}>Account aangemaakt</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: '#22d3ee' }}>✅</span>
                  <span style={{ color: '#a0a0b0' }}>Profiel ingevuld</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: '#6b6b7a' }}>⬜</span>
                  <Link href="/quotes/new" style={{ color: '#818cf8', textDecoration: 'none' }}>
                    Eerste offerte maken
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p style={{ color: '#6b6b7a' }}>Geen offertes gevonden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#6b6b7a' }}
                >
                  <th className="px-6 py-3 text-left">Nummer</th>
                  <th className="px-6 py-3 text-left">Klant</th>
                  <th className="px-6 py-3 text-left">Titel</th>
                  <th className="px-6 py-3 text-left">Datum</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    className="transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="font-mono text-sm font-semibold transition-colors"
                          style={{ color: '#818cf8' }}
                        >
                          {quote.quote_number}
                        </Link>
                        {openedSet.has(quote.id) && (
                          <span title="Bekeken door klant">
                            <Eye size={13} style={{ color: '#22d3ee' }} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#a0a0b0' }}>
                      {(quote as Quote & { clients?: { company?: string; name: string } }).clients?.company ||
                       (quote as Quote & { clients?: { company?: string; name: string } }).clients?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#a0a0b0' }}>{quote.title}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#6b6b7a' }}>{formatDate(quote.created_at)}</td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={statusBadgeStyle(quote.status)}
                      >
                        {statusLabel(quote.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold" style={{ color: '#ffffff' }}>
                      {formatCurrency(quote.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, gradient, iconColor, iconBg, subtitle,
}: {
  label: string
  value: string
  icon: React.ElementType
  gradient: string
  iconColor: string
  iconBg: string
  subtitle?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{
        background: gradient,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: '#a0a0b0' }}>{label}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#6b6b7a' }}>{subtitle}</p>}
    </div>
  )
}
