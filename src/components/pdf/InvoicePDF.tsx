import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const colors = {
  bg: '#ffffff',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  text: '#1e1e2a',
  muted: '#6b6b7a',
  border: '#e2e8f0',
  surface: '#f8fafc',
  success: '#059669',
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function fmtDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date))
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#fff', fontFamily: 'Helvetica', fontSize: 10, color: colors.text, paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0 },
  accentBar: { height: 4, backgroundColor: colors.success },
  header: { backgroundColor: '#0f172a', padding: '28 40', marginBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: '#064e3b', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10, alignSelf: 'flex-start' },
  badgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: 1.5 },
  invoiceTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 4 },
  invoiceNumber: { fontSize: 11, color: '#94a3b8' },
  totalAmount: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#6ee7b7', textAlign: 'right' },
  totalLabel: { fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 2 },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  partiesRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  party: { flex: 1, padding: 14, backgroundColor: colors.surface, borderRadius: 8 },
  partyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
  partyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.text, marginBottom: 3 },
  partyLine: { fontSize: 9, color: colors.muted, lineHeight: 1.6 },
  partyEmail: { fontSize: 9, color: colors.primary },
  metaRow: { flexDirection: 'row', gap: 20, marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  metaItem: { flexDirection: 'row', gap: 5 },
  metaLabel: { fontSize: 9, color: colors.muted },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.text },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 2 },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  cellDesc: { flex: 3, paddingRight: 8 },
  cellQty: { width: 60, textAlign: 'center' },
  cellPrice: { width: 70, textAlign: 'right' },
  cellVat: { width: 40, textAlign: 'center' },
  cellTotal: { width: 70, textAlign: 'right' },
  cellText: { fontSize: 9.5, color: colors.text },
  cellBold: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: colors.text },
  cellMuted: { fontSize: 9.5, color: colors.muted },
  totalsContainer: { marginTop: 16, marginLeft: 'auto', width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsLabel: { fontSize: 9.5, color: colors.muted },
  totalsValue: { fontSize: 9.5, color: colors.text },
  totalsFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTopWidth: 2, borderTopColor: colors.success },
  totalsFinalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.text },
  totalsFinalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.success },
  paymentBox: { marginTop: 28, padding: 18, backgroundColor: '#f0fdf4', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: colors.success },
  paymentTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#065f46', marginBottom: 10 },
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  paymentLabel: { fontSize: 9, color: '#047857', width: 100 },
  paymentValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#065f46', flex: 1 },
  pageFooter: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  pageFooterText: { fontSize: 8, color: '#c4c4d4' },
  pageFooterBrand: { fontSize: 8, color: colors.primary, fontFamily: 'Helvetica-Bold' },
  logo: { height: 32, width: 'auto', marginBottom: 10, objectFit: 'contain' },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  discountLabel: { fontSize: 9.5, color: '#ef4444' },
  discountValue: { fontSize: 9.5, color: '#ef4444' },
})

interface InvoicePDFProps {
  quote: {
    title: string
    quote_number: string
    created_at: string
    subtotal: number
    vat_amount: number
    total: number
    discount_percent?: number | null
    discount_amount?: number | null
    intro?: string | null
    footer?: string | null
    quote_items?: Array<{ sort_order: number; description: string; quantity: number; unit: string; unit_price: number; vat_rate: number; line_total: number }> | null
    clients?: { name: string; company?: string | null; email: string; address?: string | null; city?: string | null; postal?: string | null } | null
  }
  profile?: {
    company_name?: string | null
    company_address?: string | null
    company_city?: string | null
    company_postal?: string | null
    company_kvk?: string | null
    company_btw?: string | null
    company_email?: string | null
    company_phone?: string | null
    company_iban?: string | null
    logo_url?: string | null
  } | null
  invoice: {
    invoice_number: string
    due_date: string
    paid_at?: string | null
    created_at: string
  }
}

export function InvoicePDF({ quote, profile, invoice }: InvoicePDFProps) {
  const items = (quote.quote_items || []).sort((a, b) => a.sort_order - b.sort_order)
  const hasDiscount = (quote.discount_percent ?? 0) > 0 || (quote.discount_amount ?? 0) > 0
  const isPaid = !!invoice.paid_at

  return (
    <Document title={`Factuur ${invoice.invoice_number}`} author={profile?.company_name || 'Vrijdag.AI'} creator="Vrijdag.AI Offerte Platform">
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              {profile?.logo_url ? <Image src={profile.logo_url} style={styles.logo} /> : null}
              <View style={styles.badge}><Text style={styles.badgeText}>{isPaid ? '✓ Betaald' : 'Factuur'}</Text></View>
              <Text style={styles.invoiceTitle}>FACTUUR</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalAmount}>{fmt(quote.total)}</Text>
              <Text style={styles.totalLabel}>incl. BTW</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.partiesRow}>
            <View style={styles.party}>
              <Text style={styles.partyLabel}>Van</Text>
              <Text style={styles.partyName}>{profile?.company_name || '—'}</Text>
              {profile?.company_address ? <Text style={styles.partyLine}>{profile.company_address}</Text> : null}
              {profile?.company_city ? <Text style={styles.partyLine}>{profile.company_postal} {profile.company_city}</Text> : null}
              {profile?.company_email ? <Text style={styles.partyEmail}>{profile.company_email}</Text> : null}
              {profile?.company_kvk ? <Text style={styles.partyLine}>KvK: {profile.company_kvk}</Text> : null}
              {profile?.company_btw ? <Text style={styles.partyLine}>BTW: {profile.company_btw}</Text> : null}
            </View>
            {quote.clients ? (
              <View style={styles.party}>
                <Text style={styles.partyLabel}>Aan</Text>
                {quote.clients.company ? <Text style={styles.partyName}>{quote.clients.company}</Text> : null}
                <Text style={quote.clients.company ? styles.partyLine : styles.partyName}>{quote.clients.name}</Text>
                <Text style={styles.partyEmail}>{quote.clients.email}</Text>
                {quote.clients.address ? <Text style={styles.partyLine}>{quote.clients.address}</Text> : null}
                {quote.clients.city ? <Text style={styles.partyLine}>{quote.clients.postal} {quote.clients.city}</Text> : null}
              </View>
            ) : <View style={styles.party} />}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Factuurdatum:</Text><Text style={styles.metaValue}>{fmtDate(invoice.created_at)}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Vervaldatum:</Text><Text style={[styles.metaValue, { color: isPaid ? colors.success : '#ef4444' }]}>{fmtDate(invoice.due_date)}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Factuurnummer:</Text><Text style={styles.metaValue}>{invoice.invoice_number}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Offerte:</Text><Text style={styles.metaValue}>{quote.quote_number}</Text></View>
          </View>

          <View style={styles.tableHeader}>
            <View style={styles.cellDesc}><Text style={styles.tableHeaderText}>Omschrijving</Text></View>
            <View style={styles.cellQty}><Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Aantal</Text></View>
            <View style={styles.cellPrice}><Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Prijs</Text></View>
            <View style={styles.cellVat}><Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>BTW</Text></View>
            <View style={styles.cellTotal}><Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Totaal</Text></View>
          </View>

          {items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={styles.cellDesc}><Text style={styles.cellBold}>{item.description}</Text></View>
              <View style={styles.cellQty}><Text style={[styles.cellMuted, { textAlign: 'center' }]}>{item.quantity} {item.unit}</Text></View>
              <View style={styles.cellPrice}><Text style={[styles.cellMuted, { textAlign: 'right' }]}>{fmt(item.unit_price)}</Text></View>
              <View style={styles.cellVat}><Text style={[styles.cellMuted, { textAlign: 'center' }]}>{item.vat_rate}%</Text></View>
              <View style={styles.cellTotal}><Text style={[styles.cellBold, { textAlign: 'right' }]}>{fmt(item.line_total)}</Text></View>
            </View>
          ))}

          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Subtotaal (excl. BTW)</Text><Text style={styles.totalsValue}>{fmt(quote.subtotal)}</Text></View>
            {hasDiscount ? (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Korting{(quote.discount_percent ?? 0) > 0 ? ` (${quote.discount_percent}%)` : ''}</Text>
                <Text style={styles.discountValue}>-{(quote.discount_percent ?? 0) > 0 ? fmt(quote.subtotal * (quote.discount_percent! / 100)) : fmt(quote.discount_amount ?? 0)}</Text>
              </View>
            ) : null}
            <View style={styles.totalsRow}><Text style={styles.totalsLabel}>BTW</Text><Text style={styles.totalsValue}>{fmt(quote.vat_amount)}</Text></View>
            <View style={styles.totalsFinal}><Text style={styles.totalsFinalLabel}>Totaal</Text><Text style={styles.totalsFinalValue}>{fmt(quote.total)}</Text></View>
          </View>

          {profile?.company_iban ? (
            <View style={styles.paymentBox}>
              <Text style={styles.paymentTitle}>Betaalinstructies</Text>
              <View style={styles.paymentRow}><Text style={styles.paymentLabel}>IBAN:</Text><Text style={styles.paymentValue}>{profile.company_iban}</Text></View>
              <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Ten name van:</Text><Text style={styles.paymentValue}>{profile.company_name}</Text></View>
              <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Betaalreferentie:</Text><Text style={styles.paymentValue}>{invoice.invoice_number}</Text></View>
              <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Vervaldatum:</Text><Text style={[styles.paymentValue, { color: isPaid ? '#065f46' : '#dc2626' }]}>{fmtDate(invoice.due_date)}</Text></View>
            </View>
          ) : null}

          {quote.footer ? <Text style={{ marginTop: 20, fontSize: 9, color: colors.muted, lineHeight: 1.6, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>{quote.footer}</Text> : null}
        </View>

        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>{invoice.invoice_number} · {profile?.company_name || ''}</Text>
          <Text style={styles.pageFooterBrand}>Vrijdag.AI Offerte Platform</Text>
          <Text style={styles.pageFooterText} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
