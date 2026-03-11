export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Quote } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: quotes }, { data: openedQuoteIds }] = await Promise.all([
    supabase
      .from('quotes')
      .select('*, clients(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('quote_events')
      .select('quote_id')
      .eq('event_type', 'opened')
      .in('quote_id',
        // Subquery trick: we'll just pass all and filter client-side
        supabase.from('quotes').select('id').eq('user_id', user.id) as unknown as string[]
      ),
  ])

  const allQuotes = (quotes as Quote[]) || []

  // Get quote IDs that have been opened
  const openedIds = new Set((openedQuoteIds || []).map((e: { quote_id: string }) => e.quote_id))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <DashboardClient quotes={allQuotes} openedIds={[...openedIds]} />
      </main>
    </div>
  )
}
