// CVE-001: Server-side status transition endpoint
// Replaces client-side supabase status updates to prevent business logic bypass
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Only these transitions are allowed through this endpoint
// 'signed' and 'declined' MUST go through /api/sign (with token + signature)
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'expired'],
  sent: ['draft', 'expired'],
  expired: ['sent', 'draft'],
  signed: [],    // immutable — no transitions allowed
  declined: [],  // immutable — no transitions allowed
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()

  // Validate UUID
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  // Validate requested status
  const VALID_STATUSES = ['draft', 'sent', 'expired']
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status. Gebruik: draft, sent of expired.' }, { status: 400 })
  }

  // Fetch current quote (with ownership check)
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })

  // Check transition is allowed from current status
  const allowed = ALLOWED_TRANSITIONS[quote.status] || []
  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: `Statuswijziging van '${quote.status}' naar '${status}' is niet toegestaan`,
    }, { status: 422 })
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'sent') {
    updatePayload.sent_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('quotes')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id) // double ownership check

  if (error) {
    console.error('[status transition]', error.message)
    return NextResponse.json({ error: 'Statuswijziging mislukt' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}
