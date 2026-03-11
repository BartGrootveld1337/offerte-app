import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { QuoteItem } from '@/types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { quoteId } = await req.json()
  if (!quoteId) return NextResponse.json({ error: 'quoteId required' }, { status: 400 })
  if (!UUID_REGEX.test(quoteId)) return NextResponse.json({ error: 'Ongeldig quoteId formaat' }, { status: 400 })

  // Fetch original quote + items
  const { data: original, error: fetchError } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Get next quote number
  const year = new Date().getFullYear()
  const { data: lastQuotes } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('user_id', user.id)
    .like('quote_number', `OFT-${year}-%`)
    .order('quote_number', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (lastQuotes && lastQuotes.length > 0) {
    const parts = lastQuotes[0].quote_number.split('-')
    const lastNum = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }
  const nextNumber = `OFT-${year}-${String(nextNum).padStart(3, '0')}`

  // Create new quote
  const { id: _id, created_at: _ca, updated_at: _ua, sign_token: _st, signed_at: _sat,
    signed_name: _sn, signed_ip: _sip, signature_url: _su, declined_reason: _dr,
    sent_at: _senta, pdf_url: _pu, quote_items: _qi, ...quoteData } = original

  const { data: newQuote, error: insertError } = await supabase
    .from('quotes')
    .insert({
      ...quoteData,
      quote_number: nextNumber,
      status: 'draft',
      user_id: user.id,
      sign_token: crypto.randomUUID(),
    })
    .select()
    .single()

  if (insertError || !newQuote) {
    return NextResponse.json({ error: 'Failed to duplicate quote' }, { status: 500 })
  }

  // Duplicate quote items
  if (original.quote_items && original.quote_items.length > 0) {
    const newItems = original.quote_items.map((item: QuoteItem) => ({
      quote_id: newQuote.id,
      sort_order: item.sort_order,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate,
      line_total: item.line_total,
    }))
    await supabase.from('quote_items').insert(newItems)
  }

  return NextResponse.json({ id: newQuote.id })
}
