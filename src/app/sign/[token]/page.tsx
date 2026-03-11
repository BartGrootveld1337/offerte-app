export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import SignPage from '@/components/quotes/SignPage'

export default async function SignQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('sign_token', token)
    .single()

  if (!quote) notFound()

  // Get profile for company info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', quote.user_id)
    .single()

  return <SignPage quote={quote} profile={profile} token={token} />
}
