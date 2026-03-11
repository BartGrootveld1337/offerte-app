import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Text, Img, Hr, Preview,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const brandColors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  accent: '#22d3ee',
  bg: '#0a0a0f',
  cardBg: '#12121a',
  surface: '#1a1a25',
  text: '#ffffff',
  textMuted: '#a0a0b0',
  textFaint: '#6b6b7a',
  border: '#1e1e2a',
  success: '#22d3ee',
  danger: '#f87171',
};

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const emailStyles = {
  body: { backgroundColor: brandColors.bg, fontFamily: fontStack, margin: 0, padding: 0 } as React.CSSProperties,
  container: { margin: '0 auto', padding: '48px 24px', maxWidth: '600px' } as React.CSSProperties,
  content: { padding: '0' } as React.CSSProperties,
  paragraph: { color: brandColors.textMuted, fontSize: '16px', lineHeight: '26px', margin: '0 0 16px 0' } as React.CSSProperties,
  highlightBox: { backgroundColor: brandColors.cardBg, padding: '20px 24px', borderRadius: '8px', margin: '24px 0', borderLeft: `4px solid ${brandColors.primary}` } as React.CSSProperties,
  actionBox: { backgroundColor: brandColors.cardBg, padding: '20px 24px', borderRadius: '8px', marginTop: '30px', borderLeft: `4px solid ${brandColors.primary}` } as React.CSSProperties,
  successBox: { backgroundColor: brandColors.cardBg, padding: '20px 24px', borderRadius: '8px', margin: '24px 0', borderLeft: `4px solid ${brandColors.success}` } as React.CSSProperties,
  dangerBox: { backgroundColor: brandColors.cardBg, padding: '20px 24px', borderRadius: '8px', margin: '24px 0', borderLeft: `4px solid ${brandColors.danger}` } as React.CSSProperties,
  ctaButton: { display: 'inline-block' as const, background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#ffffff', padding: '16px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', textAlign: 'center' as const } as React.CSSProperties,
  tableHeader: { color: brandColors.text, borderBottom: `2px solid ${brandColors.primary}`, paddingBottom: '10px', fontSize: '18px', fontWeight: 'bold' as const, margin: '30px 0 15px 0' } as React.CSSProperties,
  tableLabel: { padding: '8px 0', color: brandColors.textFaint, width: '160px', verticalAlign: 'top' as const, fontSize: '14px' } as React.CSSProperties,
  tableValue: { padding: '8px 0', color: brandColors.text, fontWeight: 'bold' as const, fontSize: '14px' } as React.CSSProperties,
  tableLink: { color: brandColors.primaryLight, textDecoration: 'underline' } as React.CSSProperties,
  divider: { borderColor: brandColors.border, margin: '32px 0' } as React.CSSProperties,
  sectionHeading: { color: brandColors.primaryLight, margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' as const } as React.CSSProperties,
  monospace: { fontFamily: 'monospace', color: brandColors.primaryLight } as React.CSSProperties,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://offerte.vrijdag.ai';
const LOGO_URL = `${APP_URL}/vrijdag_ai_logo_mail.png`;

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="nl" dir="ltr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {children}
        </Container>
        <Section style={{ textAlign: 'center' as const, padding: '20px 0' }}>
          <Text style={{ color: brandColors.textFaint, fontSize: '12px', margin: '0' }}>
            © {new Date().getFullYear()} Vrijdag.AI · AI Implementatie &amp; Innovatie
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

export function EmailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Section style={{ textAlign: 'center' as const, marginBottom: '32px' }}>
      <Img src={LOGO_URL} alt="Vrijdag.AI" width="160" height="auto" style={{ margin: '0 auto 24px auto' }} />
      <Text style={{ color: brandColors.text, fontSize: '24px', fontWeight: 600, lineHeight: '32px', margin: '0 0 8px 0' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: brandColors.textMuted, fontSize: '16px', lineHeight: '26px', margin: '0' }}>
          {subtitle}
        </Text>
      )}
    </Section>
  );
}

export function EmailHeaderCompact({ title }: { title: string }) {
  return (
    <Section style={{ backgroundColor: brandColors.cardBg, padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
      <Img src={LOGO_URL} alt="Vrijdag.AI" width="130" height="auto" style={{ margin: '0 0 12px 0' }} />
      <Text style={{ color: brandColors.text, margin: '0', fontSize: '20px', fontWeight: 600, lineHeight: '28px' }}>
        {title}
      </Text>
    </Section>
  );
}

export function EmailFooter() {
  return (
    <>
      <Hr style={emailStyles.divider} />
      <Section style={{ textAlign: 'center' as const }}>
        <Text style={{ color: brandColors.textFaint, fontSize: '12px', lineHeight: '20px', margin: '0 0 8px 0' }}>
          Verstuurd via het Vrijdag.AI Offerte Platform
        </Text>
        <a href="https://www.vrijdag.ai" style={{ color: brandColors.primaryLight, textDecoration: 'none', fontSize: '14px' }}>
          vrijdag.ai
        </a>
      </Section>
    </>
  );
}

export function EmailFooterLight({ text }: { text: string }) {
  return (
    <>
      <Hr style={emailStyles.divider} />
      <Section>
        <Text style={{ margin: '0', color: brandColors.textFaint, fontSize: '12px', lineHeight: '20px' }}>
          {text}
        </Text>
      </Section>
    </>
  );
}

export function EmailDivider() {
  return <Hr style={emailStyles.divider} />;
}
