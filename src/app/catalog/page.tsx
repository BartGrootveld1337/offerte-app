export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import CatalogManager from '@/components/catalog/CatalogManager'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <CatalogManager initialItems={items || []} />
      </main>
    </div>
  )
}
