import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import Link from 'next/link'
import { formatCurrency, formatDate, statusLabel, statusColor } from '@/lib/utils'
import { Plus, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import type { Quote } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allQuotes = (quotes as Quote[]) || []
  const totalOpen = allQuotes.filter(q => q.status === 'sent').reduce((s, q) => s + q.total, 0)
  const totalSigned = allQuotes.filter(q => q.status === 'signed').reduce((s, q) => s + q.total, 0)
  const countDraft = allQuotes.filter(q => q.status === 'draft').length
  const countSent = allQuotes.filter(q => q.status === 'sent').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Openstaand', value: formatCurrency(totalOpen), icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'Ondertekend', value: formatCurrency(totalSigned), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Concepten', value: String(countDraft), icon: FileText, color: 'text-slate-600 bg-slate-50' },
            { label: 'Verstuurd', value: String(countSent), icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quotes table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Alle offertes</h2>
          </div>
          {allQuotes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nog geen offertes</p>
              <Link href="/quotes/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm font-medium">
                Maak je eerste offerte aan →
              </Link>
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
                  {allQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/quotes/${quote.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                          {quote.quote_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {quote.clients?.company || quote.clients?.name || '—'}
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
      </main>
    </div>
  )
}
