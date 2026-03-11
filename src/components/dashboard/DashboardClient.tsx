'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, statusLabel, statusColor } from '@/lib/utils'
import { Plus, FileText, TrendingUp, Clock, CheckCircle, Eye, Search, Filter, PercentCircle } from 'lucide-react'
import type { Quote, QuoteStatus } from '@/types'

interface Props {
  quotes: Quote[]
  openedIds: string[]
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

  // Conversion rate: signed / (sent + signed + declined)
  const decidedCount = countSigned + countDeclined
  const conversionRate = decidedCount > 0 ? Math.round((countSigned / decidedCount) * 100) : 0

  const filtered = quotes.filter(q => {
    const matchSearch = search
      ? `${q.quote_number} ${q.title} ${q.clients?.name || ''} ${q.clients?.company || ''}`.toLowerCase().includes(search.toLowerCase())
      : true
    const matchStatus = statusFilter === 'all' ? true : q.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overzicht van je offertes</p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          <Plus size={18} />
          Nieuwe offerte
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Openstaand" value={formatCurrency(totalOpen)} icon={Clock} color="text-blue-600 bg-blue-50" />
        <StatCard label="Ondertekend" value={formatCurrency(totalSigned)} icon={CheckCircle} color="text-green-600 bg-green-50" />
        <StatCard label="Concepten" value={String(countDraft)} icon={FileText} color="text-slate-600 bg-slate-50" />
        <StatCard label="Verstuurd" value={String(countSent)} icon={TrendingUp} color="text-orange-600 bg-orange-50" />
        <StatCard
          label="Conversiepercentage"
          value={`${conversionRate}%`}
          icon={PercentCircle}
          color="text-violet-600 bg-violet-50"
          subtitle={`${countSigned} van ${decidedCount} besloten`}
        />
      </div>

      {/* Quotes table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Alle offertes</h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Zoeken..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
              </div>
              {/* Status filter */}
              <div className="relative">
                <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'all')}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
          <div className="p-12 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nog geen offertes</p>
            <Link href="/quotes/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm font-medium">
              Maak je eerste offerte aan →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>Geen offertes gevonden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Nummer</th>
                  <th className="px-6 py-3 text-left">Klant</th>
                  <th className="px-6 py-3 text-left">Titel</th>
                  <th className="px-6 py-3 text-left">Datum</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/quotes/${quote.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                          {quote.quote_number}
                        </Link>
                        {openedSet.has(quote.id) && (
                          <span title="Bekeken door klant">
                            <Eye size={13} className="text-blue-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {(quote as Quote & { clients?: { company?: string; name: string } }).clients?.company ||
                       (quote as Quote & { clients?: { company?: string; name: string } }).clients?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{quote.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(quote.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(quote.status)}`}>
                        {statusLabel(quote.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(quote.total)}</td>
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

function StatCard({ label, value, icon: Icon, color, subtitle }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
