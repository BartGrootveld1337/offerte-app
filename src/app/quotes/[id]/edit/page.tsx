import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteForm from '@/components/quotes/QuoteForm'
import { generateQuoteNumber } from '@/lib/utils'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: quote }, { data: clients }, { data: profile }] = await Promise.all([
    supabase.from('quotes').select('*, quote_items(*)').eq('id', id).eq('user_id', user.id)
      .order('sort_order', { foreignTable: 'quote_items' }).single(),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!quote) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Offerte bewerken</h1>
          <p className="text-slate-500 mt-1">{quote.quote_number}</p>
        </div>
        <QuoteForm
          quote={quote}
          clients={clients || []}
          defaultVat={profile?.default_vat_rate || 21}
          defaultIntro={profile?.default_intro || ''}
          defaultFooter={profile?.default_footer || ''}
          nextNumber={quote.quote_number}
        />
      </main>
    </div>
  )
}
