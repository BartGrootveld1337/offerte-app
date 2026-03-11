import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const {
    quoteId,
    clientEmail,
    clientName,
    signUrl,
    quoteNumber,
    total,
    validUntil,
    companyName,
    companyEmail,
    companyPhone,
    companyWebsite,
  } = await req.json()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://offerte.vrijdag.ai'

  const formattedValidUntil = validUntil
    ? new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(validUntil))
    : null

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offerte ${quoteNumber}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Gradient accent top bar -->
        <tr>
          <td style="background:linear-gradient(90deg,#6366f1,#a855f7,#22d3ee);height:4px;border-radius:16px 16px 0 0;"></td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="background:#12121a;padding:40px 48px;text-align:center;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
            <img src="${appUrl}/vrijdag_ai_logo_mail.png" alt="Vrijdag.AI" height="40" style="height:40px;width:auto;margin-bottom:20px;" />
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;font-family:-apple-system,sans-serif;">${companyName}</h1>
            <p style="color:#6b6b7a;margin:0;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Offerte ter ondertekening</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#1a1a25;padding:48px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
            <p style="color:#ffffff;font-size:17px;margin:0 0 8px;font-weight:600;">Beste ${clientName},</p>
            <p style="color:#a0a0b0;font-size:15px;line-height:1.7;margin:0 0 32px;">
              Hartelijk dank voor uw interesse. Hierbij ontvangt u onze offerte. We kijken ernaar uit om voor u aan de slag te gaan.
            </p>

            <!-- Quote summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#12121a;border:1px solid rgba(99,102,241,0.2);border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="color:#6b6b7a;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Offerteoverzicht</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#a0a0b0;font-size:14px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">Offertenummer</td>
                      <td align="right" style="color:#818cf8;font-size:14px;font-weight:600;font-family:monospace;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${quoteNumber}</td>
                    </tr>
                    <tr>
                      <td style="color:#a0a0b0;font-size:14px;padding:8px 0 6px;">Totaalbedrag (incl. BTW)</td>
                      <td align="right" style="font-size:26px;font-weight:800;padding:8px 0 6px;background:linear-gradient(135deg,#6366f1,#a855f7,#22d3ee);-webkit-background-clip:text;color:#818cf8;">${total}</td>
                    </tr>
                    ${formattedValidUntil ? `<tr>
                      <td style="color:#a0a0b0;font-size:14px;padding:6px 0 0;">Geldig tot</td>
                      <td align="right" style="color:#f87171;font-size:14px;font-weight:600;padding:6px 0 0;">${formattedValidUntil}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 40px;">
                  <a href="${signUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;padding:18px 40px;border-radius:12px;font-weight:700;font-size:17px;letter-spacing:0.3px;box-shadow:0 8px 25px rgba(99,102,241,0.4);">
                    Offerte bekijken &amp; ondertekenen →
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#6b6b7a;font-size:13px;text-align:center;margin:0 0 8px;">Of kopieer deze link in uw browser:</p>
            <p style="text-align:center;margin:0 0 32px;">
              <a href="${signUrl}" style="color:#818cf8;font-size:12px;word-break:break-all;">${signUrl}</a>
            </p>

            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;">
            <p style="color:#6b6b7a;font-size:13px;line-height:1.6;margin:0;">
              Heeft u vragen over deze offerte? Neem dan gerust contact met ons op.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d0d14;border-radius:0 0 16px 16px;padding:32px 48px;text-align:center;border:1px solid rgba(255,255,255,0.06);border-top:none;">
            <img src="${appUrl}/vrijdag_ai_logo_mail.png" alt="Vrijdag.AI" height="28" style="height:28px;width:auto;opacity:0.7;margin-bottom:16px;" />
            <p style="color:#ffffff;font-weight:700;font-size:15px;margin:0 0 8px;">${companyName}</p>
            ${companyEmail ? `<p style="color:#6b6b7a;font-size:13px;margin:0 0 4px;"><a href="mailto:${companyEmail}" style="color:#6b6b7a;text-decoration:none;">✉️ ${companyEmail}</a></p>` : ''}
            ${companyPhone ? `<p style="color:#6b6b7a;font-size:13px;margin:0 0 4px;">📞 ${companyPhone}</p>` : ''}
            ${companyWebsite ? `<p style="color:#6b6b7a;font-size:13px;margin:0 0 16px;"><a href="${companyWebsite}" style="color:#6b6b7a;text-decoration:none;">🌐 ${companyWebsite}</a></p>` : ''}
            <p style="color:#3a3a4a;font-size:11px;margin:16px 0 0;">Aangedreven door Vrijdag.AI Offerte Platform</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
  try {
    await resend.emails.send({
      from: `${companyName} <offerte@vrijdag.ai>`,
      to: clientEmail,
      subject: `Offerte ${quoteNumber} — ${total} | ${companyName}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
