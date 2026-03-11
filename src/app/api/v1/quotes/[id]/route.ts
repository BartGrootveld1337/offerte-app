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

type Params = Promise<{ id: string }>

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const auth = await authenticateApiKey(req.headers.get('authorization'), ip)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const auth = await authenticateApiKey(req.headers.get('authorization'), ip)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const supabase = getSupabase()

  // Whitelist allowed update fields — prevent overwriting sign/audit fields
  const allowed = ['title', 'client_id', 'intro', 'footer', 'valid_until', 'notes', 'subtotal', 'vat_amount', 'total', 'discount_percent', 'discount_amount', 'status']
  const safeBody: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) safeBody[key] = body[key]
  }

  // Restrict status to safe values — signed/declined must go through the sign flow
  const ALLOWED_STATUSES = ['draft', 'sent', 'expired']
  if (safeBody.status !== undefined && !ALLOWED_STATUSES.includes(safeBody.status as string)) {
    return NextResponse.json({ error: 'Ongeldige status waarde' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.userId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Niet gevonden of update mislukt' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const auth = await authenticateApiKey(req.headers.get('authorization'), ip)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabase()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId)

  if (error) console.error('[v1/quotes/id]', error.message)
  return NextResponse.json({ error: 'Er is een serverfout opgetreden' }, { status: 500 })
  return NextResponse.json({ success: true })
}
