import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteForm from '@/components/quotes/QuoteForm'
import { generateQuoteNumber } from '@/lib/utils'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clients }, { data: profile }, { count }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const nextNumber = generateQuoteNumber((count || 0) + 1)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Nieuwe offerte</h1>
          <p className="text-slate-500 mt-1">Vul de gegevens in en stuur hem op naar de klant</p>
        </div>
        <QuoteForm
          clients={clients || []}
          defaultVat={profile?.default_vat_rate || 21}
          defaultIntro={profile?.default_intro || ''}
          defaultFooter={profile?.default_footer || ''}
          nextNumber={nextNumber}
        />
      </main>
    </div>
  )
}
