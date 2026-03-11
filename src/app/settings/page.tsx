export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import SettingsForm from '@/components/SettingsForm'
import ApiKeysManager from '@/components/settings/ApiKeysManager'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: clients } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeTab = tab || 'profile'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Instellingen</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100 mb-6 w-fit">
          {[
            { key: 'profile', label: '🏢 Bedrijfsprofiel' },
            { key: 'api', label: '🔑 API Sleutels' },
          ].map(t => (
            <a
              key={t.key}
              href={`/settings?tab=${t.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {activeTab === 'profile' && (
          <SettingsForm profile={profile} clients={clients || []} userId={user.id} />
        )}
        {activeTab === 'api' && (
          <ApiKeysManager initialKeys={apiKeys || []} />
        )}
      </main>
    </div>
  )
}
