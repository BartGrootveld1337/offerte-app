export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteForm from '@/components/quotes/QuoteForm'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: quote }, { data: clients }, { data: profile }, { data: catalogItems }, { data: templates }] = await Promise.all([
    supabase.from('quotes').select('*, quote_items(*)').eq('id', id).eq('user_id', user.id)
      .order('sort_order', { foreignTable: 'quote_items' }).single(),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('catalog_items').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quote_templates').select('*').eq('user_id', user.id).order('name'),
  ])

  if (!quote) notFound()

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>Offerte bewerken</h1>
          <p className="mt-1" style={{ color: '#6b6b7a' }}>{quote.quote_number}</p>
        </div>
        <QuoteForm
          quote={quote}
          clients={clients || []}
          catalogItems={catalogItems || []}
          templates={templates || []}
          defaultVat={profile?.default_vat_rate || 21}
          defaultIntro={profile?.default_intro || ''}
          defaultFooter={profile?.default_footer || ''}
          nextNumber={quote.quote_number}
        />
      </main>
    </div>
  )
}
