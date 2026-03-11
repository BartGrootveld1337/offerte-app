import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = new Date().getFullYear()

  // Get the max quote_number for this user to avoid collisions
  const { data: quotes } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('user_id', user.id)
    .like('quote_number', `OFT-${year}-%`)
    .order('quote_number', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (quotes && quotes.length > 0) {
    const lastNumber = quotes[0].quote_number
    const parts = lastNumber.split('-')
    const lastNum = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }

  const nextNumber = `OFT-${year}-${String(nextNum).padStart(3, '0')}`
  return NextResponse.json({ nextNumber })
}
