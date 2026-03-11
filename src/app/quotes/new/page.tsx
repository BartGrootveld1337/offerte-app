export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteForm from '@/components/quotes/QuoteForm'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clients }, { data: profile }, { data: catalogItems }, { data: templates }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('catalog_items').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quote_templates').select('*').eq('user_id', user.id).order('name'),
  ])

  // Collision-safe: use max quote_number instead of count
  const year = new Date().getFullYear()
  const { data: lastQuotes } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('user_id', user.id)
    .like('quote_number', `OFT-${year}-%`)
    .order('quote_number', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (lastQuotes && lastQuotes.length > 0) {
    const parts = lastQuotes[0].quote_number.split('-')
    const lastNum = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }
  const nextNumber = `OFT-${year}-${String(nextNum).padStart(3, '0')}`

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
