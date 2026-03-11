export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteForm from '@/components/quotes/QuoteForm'
import { generateQuoteNumber } from '@/lib/utils'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clients }, { data: profile }, { count }, { data: catalogItems }, { data: templates }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('catalog_items').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quote_templates').select('*').eq('user_id', user.id).order('name'),
  ])

  const nextNumber = generateQuoteNumber((count || 0) + 1)

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}>Nieuwe offerte</h1>
          <p className="mt-1" style={{ color: '#6b6b7a' }}>Vul de gegevens in en stuur hem op naar de klant</p>
        </div>
        <QuoteForm
          clients={clients || []}
          catalogItems={catalogItems || []}
          templates={templates || []}
          defaultVat={profile?.default_vat_rate || 21}
          defaultIntro={profile?.default_intro || ''}
          defaultFooter={profile?.default_footer || ''}
          nextNumber={nextNumber}
        />
      </main>
    </div>
  )
}
