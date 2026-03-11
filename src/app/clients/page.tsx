export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import ClientsManager from '@/components/clients/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quotes').select('client_id, total, status').eq('user_id', user.id),
  ])

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <ClientsManager initialClients={clients || []} quotes={quotes || []} />
      </main>
    </div>
  )
}
