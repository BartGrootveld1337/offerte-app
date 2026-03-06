export interface Profile {
  id: string
  company_name: string
  company_address?: string
  company_city?: string
  company_postal?: string
  company_country?: string
  company_kvk?: string
  company_btw?: string
  company_iban?: string
  company_email?: string
  company_phone?: string
  company_website?: string
  logo_url?: string
  default_payment_days: number
  default_vat_rate: number
  default_intro?: string
  default_footer?: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  company?: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal?: string
  country?: string
  notes?: string
  created_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  sort_order: number
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  line_total: number
}

export type QuoteStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'declined'

export interface Quote {
  id: string
  user_id: string
  client_id?: string
  quote_number: string
  status: QuoteStatus
  title: string
  intro?: string
  footer?: string
  valid_until?: string
  subtotal: number
  vat_amount: number
  total: number
  sign_token?: string
  signed_at?: string
  signed_name?: string
  signed_ip?: string
  signature_url?: string
  sent_at?: string
  pdf_url?: string
  notes?: string
  created_at: string
  updated_at: string
  clients?: Client
  quote_items?: QuoteItem[]
}
