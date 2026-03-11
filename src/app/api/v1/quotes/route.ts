import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { authenticateApiKey } from '@/lib/api-auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const auth = await authenticateApiKey(req.headers.get('authorization'), ip)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v1/quotes GET]', error.message)
    return NextResponse.json({ error: 'Er is een serverfout opgetreden' }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const auth = await authenticateApiKey(req.headers.get('authorization'), ip)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = getSupabase()

  // Whitelist allowed fields — prevent mass assignment
  const allowed = ['quote_number', 'title', 'client_id', 'intro', 'footer', 'valid_until', 'notes', 'subtotal', 'vat_amount', 'total', 'discount_percent', 'discount_amount']
  const safeBody: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) safeBody[key] = body[key]
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({ ...safeBody, user_id: auth.userId, status: 'draft' })
    .select()
    .single()

  if (error) {
    console.error('[v1/quotes POST]', error.message)
    return NextResponse.json({ error: 'Er is een serverfout opgetreden' }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
