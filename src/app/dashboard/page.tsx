export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Quote } from '@/types'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  // Onboarding check
  const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', user.id).single()
  if (!profile?.company_name) redirect('/onboarding')

  // Auto-expire sent quotes past their valid_until date
  supabase
    .from('quotes')
    .update({ status: 'expired' })
    .eq('user_id', user.id)
    .eq('status', 'sent')
    .lt('valid_until', new Date().toISOString())
    .then(() => {}) // fire and forget

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allQuotes = (quotes as Quote[]) || []
  const quoteIds = allQuotes.map(q => q.id)

  let openedIds = new Set<string>()
  if (quoteIds.length > 0) {
    const { data: openedEvents } = await supabase
      .from('quote_events')
      .select('quote_id')
      .eq('event_type', 'opened')
      .in('quote_id', quoteIds)
    
    openedIds = new Set((openedEvents || []).map((e: { quote_id: string }) => e.quote_id))
  }

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <DashboardClient quotes={allQuotes} openedIds={[...openedIds]} />
      </main>
    </div>
  )
}
