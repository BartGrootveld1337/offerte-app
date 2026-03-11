export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import InvoiceDetail from '@/components/invoices/InvoiceDetail'

export const metadata = { title: 'Factuur' }

export default async function InvoicePage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (!quote || quote.status !== 'signed') notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Get or create invoice
  let { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('quote_id', quoteId)
    .single()

  if (!invoice) {
    // Generate invoice number
    const year = new Date().getFullYear()
    const { data: lastInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (lastInvoices && lastInvoices.length > 0) {
      const parts = lastInvoices[0].invoice_number.split('-')
      const lastNum = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }
    const invoiceNumber = `INV-${year}-${String(nextNum).padStart(3, '0')}`

    const paymentDays = profile?.default_payment_days || 30
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + paymentDays)

    // Use upsert with onConflict to handle race conditions
    // The unique constraint on quote_id means only one invoice is ever created
    const { data: newInvoice } = await supabase
      .from('invoices')
      .upsert(
        {
          quote_id: quoteId,
          user_id: user.id,
          invoice_number: invoiceNumber,
          due_date: dueDate.toISOString().split('T')[0],
        },
        { onConflict: 'quote_id', ignoreDuplicates: false }
      )
      .select()
      .single()

    invoice = newInvoice
  }

  return (
    <div className="min-h-screen dot-grid" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <InvoiceDetail quote={quote} profile={profile} invoice={invoice} />
      </main>
    </div>
  )
}
