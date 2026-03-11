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
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1
          className="text-3xl font-bold mb-6"
          style={{
            color: '#ffffff',
            fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
          }}
        >
          Instellingen
        </h1>

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
          style={{
            background: '#1e1e2a',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { key: 'profile', label: '🏢 Bedrijfsprofiel' },
            { key: 'api', label: '🔑 API Sleutels' },
          ].map(t => (
            <a
              key={t.key}
              href={`/settings?tab=${t.key}`}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                activeTab === t.key
                  ? {
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      color: 'white',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                    }
                  : { color: '#a0a0b0' }
              }
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
