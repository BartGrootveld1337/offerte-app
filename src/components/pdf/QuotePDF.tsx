import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

const colors = {
  bg: '#ffffff',
  dark: '#0a0a0f',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  accent: '#a855f7',
  text: '#1e1e2a',
  muted: '#6b6b7a',
  border: '#e2e8f0',
  surface: '#f8fafc',
  indigo: '#4f46e5',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.text,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: '#0f172a',
    padding: '32 40',
    marginBottom: 0,
  },
  headerAccentBar: {
    height: 4,
    backgroundColor: colors.primary,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryLight,
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-end',
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  party: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 3,
  },
  partyLine: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.6,
  },
  partyLineIndigo: {
    fontSize: 9,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 6,
  },
  metaLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  intro: {
    fontSize: 9.5,
    color: colors.muted,
    lineHeight: 1.7,
    marginBottom: 24,
    paddingLeft: 12,
    paddingVertical: 10,
    paddingRight: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: '#f0f0ff',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  cellDescription: { flex: 3, paddingRight: 8 },
  cellQty: { width: 60, textAlign: 'center' },
  cellPrice: { width: 70, textAlign: 'right' },
  cellVat: { width: 40, textAlign: 'center' },
  cellTotal: { width: 70, textAlign: 'right' },
  cellText: {
    fontSize: 9.5,
    color: colors.text,
  },
  cellTextMuted: {
    fontSize: 9.5,
    color: colors.muted,
  },
  cellTextBold: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  totalsContainer: {
    marginTop: 16,
    marginLeft: 'auto',
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 9.5,
    color: colors.muted,
  },
  totalsValue: {
    fontSize: 9.5,
    color: colors.text,
  },
  totalsFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalsFinalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  totalsFinalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  footerText: {
    marginTop: 24,
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  signatureImage: {
    height: 60,
    width: 160,
    objectFit: 'contain',
  },
  signedByText: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 6,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageFooterText: {
    fontSize: 8,
    color: '#c4c4d4',
  },
  pageFooterBrand: {
    fontSize: 8,
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  discountLabel: {
    fontSize: 9.5,
    color: '#ef4444',
  },
  discountValue: {
    fontSize: 9.5,
    color: '#ef4444',
  },
  logo: {
    height: 36,
    width: 'auto',
    marginBottom: 12,
    objectFit: 'contain',
  },
})

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Concept',
    sent: 'Verstuurd',
    signed: 'Ondertekend',
    expired: 'Verlopen',
    declined: 'Afgewezen',
  }
  return labels[status] || status
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function fmtDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date))
}

interface QuotePDFProps {
  quote: {
    id: string
    title: string
    quote_number: string
    status: string
    intro?: string | null
    footer?: string | null
    valid_until?: string | null
    created_at: string
    subtotal: number
    vat_amount: number
    total: number
    discount_percent?: number | null
    discount_amount?: number | null
    signed_at?: string | null
    signed_name?: string | null
    signature_url?: string | null
    quote_items?: Array<{
      sort_order: number
      description: string
      quantity: number
      unit: string
      unit_price: number
      vat_rate: number
      line_total: number
    }> | null
    clients?: {
      name: string
      company?: string | null
      email: string
      address?: string | null
      city?: string | null
      postal?: string | null
    } | null
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
    company_website?: string | null
    company_iban?: string | null
    logo_url?: string | null
  } | null
}

export function QuotePDF({ quote, profile }: QuotePDFProps) {
  const items = (quote.quote_items || []).sort((a, b) => a.sort_order - b.sort_order)
  const hasDiscount = (quote.discount_percent ?? 0) > 0 || (quote.discount_amount ?? 0) > 0

  return (
    <Document
      title={`Offerte ${quote.quote_number}`}
      author={profile?.company_name || 'Vrijdag.AI'}
      subject={quote.title}
      creator="Vrijdag.AI Offerte Platform"
    >
      <Page size="A4" style={styles.page}>
        {/* Accent bar */}
        <View style={styles.headerAccentBar} />

        {/* Dark header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {profile?.logo_url ? (
                <Image src={profile.logo_url} style={styles.logo} />
              ) : null}
              <Text style={styles.quoteTitle}>{quote.title}</Text>
              <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.totalAmount}>{fmt(quote.total)}</Text>
              <Text style={styles.totalLabel}>incl. BTW</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{statusLabel(quote.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Parties */}
          <View style={styles.partiesRow}>
            {/* From */}
            <View style={styles.party}>
              <Text style={styles.partyLabel}>Van</Text>
              <Text style={styles.partyName}>{profile?.company_name || '—'}</Text>
              {profile?.company_address ? <Text style={styles.partyLine}>{profile.company_address}</Text> : null}
              {profile?.company_city ? <Text style={styles.partyLine}>{profile.company_postal} {profile.company_city}</Text> : null}
              {profile?.company_email ? <Text style={styles.partyLineIndigo}>{profile.company_email}</Text> : null}
              {profile?.company_phone ? <Text style={styles.partyLine}>{profile.company_phone}</Text> : null}
              {profile?.company_kvk ? <Text style={styles.partyLine}>KvK: {profile.company_kvk}</Text> : null}
              {profile?.company_btw ? <Text style={styles.partyLine}>BTW: {profile.company_btw}</Text> : null}
            </View>
            {/* To */}
            {quote.clients ? (
              <View style={styles.party}>
                <Text style={styles.partyLabel}>Aan</Text>
                {quote.clients.company ? <Text style={styles.partyName}>{quote.clients.company}</Text> : null}
                <Text style={quote.clients.company ? styles.partyLine : styles.partyName}>{quote.clients.name}</Text>
                <Text style={styles.partyLineIndigo}>{quote.clients.email}</Text>
                {quote.clients.address ? <Text style={styles.partyLine}>{quote.clients.address}</Text> : null}
                {quote.clients.city ? <Text style={styles.partyLine}>{quote.clients.postal} {quote.clients.city}</Text> : null}
              </View>
            ) : <View style={styles.party} />}
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Datum:</Text>
              <Text style={styles.metaValue}>{fmtDate(quote.created_at)}</Text>
            </View>
            {quote.valid_until ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Geldig tot:</Text>
                <Text style={styles.metaValue}>{fmtDate(quote.valid_until)}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Offertenummer:</Text>
              <Text style={styles.metaValue}>{quote.quote_number}</Text>
            </View>
          </View>

          {/* Intro */}
          {quote.intro ? (
            <Text style={styles.intro}>{quote.intro}</Text>
          ) : null}

          {/* Items table */}
          <View style={styles.tableHeader}>
            <View style={styles.cellDescription}><Text style={styles.tableHeaderText}>Omschrijving</Text></View>
            <View style={styles.cellQty}><Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Aantal</Text></View>
            <View style={styles.cellPrice}><Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Prijs</Text></View>
            <View style={styles.cellVat}><Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>BTW</Text></View>
            <View style={styles.cellTotal}><Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Totaal</Text></View>
          </View>

          {items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={styles.cellDescription}><Text style={styles.cellTextBold}>{item.description}</Text></View>
              <View style={styles.cellQty}><Text style={[styles.cellTextMuted, { textAlign: 'center' }]}>{item.quantity} {item.unit}</Text></View>
              <View style={styles.cellPrice}><Text style={[styles.cellTextMuted, { textAlign: 'right' }]}>{fmt(item.unit_price)}</Text></View>
              <View style={styles.cellVat}><Text style={[styles.cellTextMuted, { textAlign: 'center' }]}>{item.vat_rate}%</Text></View>
              <View style={styles.cellTotal}><Text style={[styles.cellTextBold, { textAlign: 'right' }]}>{fmt(item.line_total)}</Text></View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotaal (excl. BTW)</Text>
              <Text style={styles.totalsValue}>{fmt(quote.subtotal)}</Text>
            </View>
            {hasDiscount ? (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>
                  Korting{(quote.discount_percent ?? 0) > 0 ? ` (${quote.discount_percent}%)` : ''}
                </Text>
                <Text style={styles.discountValue}>
                  -{(quote.discount_percent ?? 0) > 0
                    ? fmt(quote.subtotal * (quote.discount_percent! / 100))
                    : fmt(quote.discount_amount ?? 0)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>BTW</Text>
              <Text style={styles.totalsValue}>{fmt(quote.vat_amount)}</Text>
            </View>
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>Totaal</Text>
              <Text style={styles.totalsFinalValue}>{fmt(quote.total)}</Text>
            </View>
          </View>

          {/* Footer text */}
          {quote.footer ? (
            <Text style={styles.footerText}>{quote.footer}</Text>
          ) : null}

          {/* Signature */}
          {quote.signed_at ? (
            <View style={styles.signatureSection}>
              <Text style={styles.signatureLabel}>Digitale handtekening</Text>
              {quote.signature_url ? (
                <Image src={quote.signature_url} style={styles.signatureImage} />
              ) : null}
              <Text style={styles.signedByText}>
                Ondertekend door {quote.signed_name} op {fmtDate(quote.signed_at)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Page footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>{quote.quote_number} · {profile?.company_name || ''}</Text>
          <Text style={styles.pageFooterBrand}>Vrijdag.AI Offerte Platform</Text>
          <Text
            style={styles.pageFooterText}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
