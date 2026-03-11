export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateQuoteNumber(count: number): string {
  const year = new Date().getFullYear()
  const num = String(count).padStart(3, '0')
  return `OFT-${year}-${num}`
}

export function calculateTotals(
  items: Array<{
    quantity: number
    unit_price: number
    vat_rate: number
  }>,
  discountPercent = 0,
  discountAmount = 0
) {
  let subtotal = 0
  let vat_amount = 0

  items.forEach((item) => {
    const lineTotal = item.quantity * item.unit_price
    subtotal += lineTotal
    vat_amount += lineTotal * (item.vat_rate / 100)
  })

  // Apply percentage discount first, then fixed amount
  const percentDiscount = subtotal * (discountPercent / 100)
  const totalDiscount = percentDiscount + discountAmount
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount)

  // Recalculate VAT proportionally if discount applied
  const vatMultiplier = subtotal > 0 ? discountedSubtotal / subtotal : 1
  const adjustedVat = vat_amount * vatMultiplier

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_total: Math.round(totalDiscount * 100) / 100,
    discounted_subtotal: Math.round(discountedSubtotal * 100) / 100,
    vat_amount: Math.round(adjustedVat * 100) / 100,
    total: Math.round((discountedSubtotal + adjustedVat) * 100) / 100,
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Concept',
    sent: 'Verstuurd',
    signed: 'Ondertekend',
    expired: 'Verlopen',
    declined: 'Afgewezen',
  }
  return labels[status] || status
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    signed: 'bg-green-100 text-green-700',
    expired: 'bg-orange-100 text-orange-700',
    declined: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    opened: 'Geopend',
    signed: 'Ondertekend',
    declined: 'Afgewezen',
    sent: 'Verstuurd',
  }
  return labels[eventType] || eventType
}

export function eventColor(eventType: string): string {
  const colors: Record<string, string> = {
    opened: 'bg-blue-100 text-blue-700',
    signed: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    sent: 'bg-purple-100 text-purple-700',
  }
  return colors[eventType] || 'bg-gray-100 text-gray-700'
}
