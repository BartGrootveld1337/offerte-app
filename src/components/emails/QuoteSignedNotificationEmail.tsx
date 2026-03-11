import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import {
  EmailLayout, EmailHeaderCompact, EmailFooterLight,
  emailStyles, brandColors,
} from './EmailLayout';

interface QuoteSignedNotificationEmailProps {
  clientName: string;
  signedName: string;
  quoteNumber: string;
  quoteTitle: string;
  total: string;
  signedAt: string;
  dashboardUrl: string;
}

export function QuoteSignedNotificationEmail({
  clientName,
  signedName,
  quoteNumber,
  quoteTitle,
  total,
  signedAt,
  dashboardUrl,
}: QuoteSignedNotificationEmailProps) {
  return (
    <EmailLayout preview={`✅ Offerte ${quoteNumber} is ondertekend door ${signedName}`}>
      <EmailHeaderCompact title="Offerte Ondertekend ✅" />

      <Section style={emailStyles.content}>
        <Section style={emailStyles.successBox}>
          <Text style={{ margin: '0', color: brandColors.success, fontSize: '16px', fontWeight: 600 }}>
            Goed nieuws! Offerte {quoteNumber} is ondertekend.
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
              <td style={emailStyles.tableLabel}>Ondertekend door:</td>
              <td style={emailStyles.tableValue}>{signedName}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Totaalbedrag:</td>
              <td style={{ ...emailStyles.tableValue, color: brandColors.primaryLight, fontSize: '18px' }}>{total}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Ondertekend op:</td>
              <td style={emailStyles.tableValue}>{signedAt}</td>
            </tr>
          </tbody>
        </table>

        <Section style={emailStyles.actionBox}>
          <Text style={{ margin: '0', color: brandColors.textMuted, fontSize: '14px' }}>
            <strong style={{ color: brandColors.text }}>Actie:</strong>{' '}
            Bekijk de ondertekende offerte in het dashboard en stuur een factuur.{' '}
            <Link href={dashboardUrl} style={emailStyles.tableLink}>Open dashboard →</Link>
          </Text>
        </Section>
      </Section>

      <EmailFooterLight text="Dit bericht is automatisch verstuurd door het Vrijdag.AI Offerte Platform." />
    </EmailLayout>
  );
}
