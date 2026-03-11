export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import QuoteDetail from '@/components/quotes/QuoteDetail'

export default async function QuoteDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}) {
  const { id } = await params
  const { action } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .order('sort_order', { foreignTable: 'quote_items' })
    .single()

  if (!quote) notFound()

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('quote_events').select('*').eq('quote_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <QuoteDetail
          quote={quote}
          profile={profile}
          events={events || []}
          autoSend={action === 'send'}
        />
      </main>
    </div>
  )
}
