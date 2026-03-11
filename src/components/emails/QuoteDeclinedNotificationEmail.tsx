import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import {
  EmailLayout, EmailHeaderCompact, EmailFooterLight,
  emailStyles, brandColors,
} from './EmailLayout';

interface QuoteDeclinedNotificationEmailProps {
  clientName: string;
  quoteNumber: string;
  quoteTitle: string;
  total: string;
  declinedReason?: string;
  dashboardUrl: string;
}

export function QuoteDeclinedNotificationEmail({
  clientName,
  quoteNumber,
  quoteTitle,
  total,
  declinedReason,
  dashboardUrl,
}: QuoteDeclinedNotificationEmailProps) {
  return (
    <EmailLayout preview={`Offerte ${quoteNumber} is afgewezen door ${clientName}`}>
      <EmailHeaderCompact title="Offerte Afgewezen" />

      <Section style={emailStyles.content}>
        <Section style={emailStyles.dangerBox}>
          <Text style={{ margin: '0', color: brandColors.danger, fontSize: '16px', fontWeight: 600 }}>
            Offerte {quoteNumber} is helaas afgewezen door {clientName}.
          </Text>
        </Section>

        <Text style={emailStyles.tableHeader}>Details</Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <tbody>
            <tr>
              <td style={emailStyles.tableLabel}>Offertenummer:</td>
              <td style={{ ...emailStyles.tableValue, ...emailStyles.monospace }}>{quoteNumber}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Offerte:</td>
              <td style={emailStyles.tableValue}>{quoteTitle}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Klant:</td>
              <td style={emailStyles.tableValue}>{clientName}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Totaalbedrag:</td>
              <td style={emailStyles.tableValue}>{total}</td>
            </tr>
          </tbody>
        </table>

        {declinedReason && (
          <>
            <Text style={{ ...emailStyles.tableHeader, marginTop: '30px' }}>Reden afwijzing</Text>
            <Section style={{ backgroundColor: brandColors.cardBg, padding: '20px 24px', borderRadius: '8px', marginTop: '12px' }}>
              <Text style={{ color: brandColors.textMuted, fontSize: '14px', lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' as const }}>
                {declinedReason}
              </Text>
            </Section>
          </>
        )}

        <Section style={emailStyles.actionBox}>
          <Text style={{ margin: '0', color: brandColors.textMuted, fontSize: '14px' }}>
            <strong style={{ color: brandColors.text }}>Tip:</strong>{' '}
            Neem contact op met de klant om de bezwaren te bespreken en pas eventueel de offerte aan.{' '}
            <Link href={dashboardUrl} style={emailStyles.tableLink}>Open dashboard →</Link>
          </Text>
        </Section>
      </Section>

      <EmailFooterLight text="Dit bericht is automatisch verstuurd door het Vrijdag.AI Offerte Platform." />
    </EmailLayout>
  );
}
