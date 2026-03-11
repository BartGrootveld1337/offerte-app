import * as React from 'react';
import { Section, Text, Button, Link } from '@react-email/components';
import {
  EmailLayout, EmailHeader, EmailFooter,
  emailStyles, brandColors,
} from './EmailLayout';

interface QuoteClientEmailProps {
  clientName: string;
  companyName: string;
  quoteNumber: string;
  total: string;
  validUntil?: string;
  signUrl: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
}

export function QuoteClientEmail({
  clientName,
  companyName,
  quoteNumber,
  total,
  validUntil,
  signUrl,
  companyEmail,
  companyPhone,
  companyWebsite,
}: QuoteClientEmailProps) {
  return (
    <EmailLayout preview={`Offerte ${quoteNumber} van ${companyName} — ${total}`}>
      <EmailHeader
        title={companyName}
        subtitle="heeft een offerte voor u klaarstaan"
      />

      <Section style={emailStyles.content}>
        <Text style={emailStyles.paragraph}>
          Beste {clientName},
        </Text>
        <Text style={emailStyles.paragraph}>
          Hartelijk dank voor uw interesse. Hierbij ontvangt u onze offerte.
          We kijken ernaar uit om voor u aan de slag te gaan.
        </Text>

        {/* Quote summary */}
        <Text style={emailStyles.tableHeader}>Offerteoverzicht</Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <tbody>
            <tr>
              <td style={emailStyles.tableLabel}>Offertenummer:</td>
              <td style={{ ...emailStyles.tableValue, ...emailStyles.monospace }}>{quoteNumber}</td>
            </tr>
            <tr>
              <td style={emailStyles.tableLabel}>Totaal (incl. BTW):</td>
              <td style={{ ...emailStyles.tableValue, fontSize: '20px', color: brandColors.primaryLight }}>{total}</td>
            </tr>
            {validUntil && (
              <tr>
                <td style={emailStyles.tableLabel}>Geldig tot:</td>
                <td style={{ ...emailStyles.tableValue, color: brandColors.danger }}>{validUntil}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* CTA */}
        <Section style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <Button href={signUrl} style={emailStyles.ctaButton}>
            Offerte bekijken &amp; ondertekenen →
          </Button>
        </Section>

        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', textAlign: 'center' as const }}>
          Of kopieer deze link:{' '}
          <Link href={signUrl} style={emailStyles.tableLink}>{signUrl}</Link>
        </Text>

        {/* Contact info */}
        {(companyEmail || companyPhone || companyWebsite) && (
          <>
            <Text style={{ ...emailStyles.tableHeader, marginTop: '32px' }}>Contact</Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <tbody>
                {companyEmail && (
                  <tr>
                    <td style={emailStyles.tableLabel}>E-mail:</td>
                    <td style={{ padding: '8px 0' }}>
                      <Link href={`mailto:${companyEmail}`} style={emailStyles.tableLink}>{companyEmail}</Link>
                    </td>
                  </tr>
                )}
                {companyPhone && (
                  <tr>
                    <td style={emailStyles.tableLabel}>Telefoon:</td>
                    <td style={{ padding: '8px 0' }}>
                      <Link href={`tel:${companyPhone}`} style={emailStyles.tableLink}>{companyPhone}</Link>
                    </td>
                  </tr>
                )}
                {companyWebsite && (
                  <tr>
                    <td style={emailStyles.tableLabel}>Website:</td>
                    <td style={{ padding: '8px 0' }}>
                      <Link href={companyWebsite} style={emailStyles.tableLink}>{companyWebsite}</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}
