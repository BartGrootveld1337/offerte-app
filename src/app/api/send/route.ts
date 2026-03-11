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
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:16px 16px 0 0;padding:40px 48px;text-align:center;">
            <div style="display:inline-block;background:#2563eb;border-radius:12px;padding:10px 16px;margin-bottom:16px;">
              <span style="color:white;font-weight:bold;font-size:18px;">📄</span>
            </div>
            <h1 style="color:white;margin:0 0 8px;font-size:28px;font-weight:800;">${companyName}</h1>
            <p style="color:#94a3b8;margin:0;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Offerte ter ondertekening</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:48px;">
            <p style="color:#334155;font-size:17px;margin:0 0 8px;">Beste ${clientName},</p>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 32px;">
              Hartelijk dank voor uw interesse. Hierbij ontvangt u onze offerte. We kijken ernaar uit om voor u aan de slag te gaan.
            </p>

            <!-- Quote summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Offerteoverzicht</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:14px;padding:4px 0;">Offertenummer</td>
                      <td align="right" style="color:#1e293b;font-size:14px;font-weight:600;font-family:monospace;padding:4px 0;">${quoteNumber}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-size:14px;padding:4px 0;">Totaalbedrag (incl. BTW)</td>
                      <td align="right" style="color:#1e293b;font-size:22px;font-weight:800;padding:4px 0;">${total}</td>
                    </tr>
                    ${formattedValidUntil ? `<tr>
                      <td style="color:#64748b;font-size:14px;padding:4px 0;">Geldig tot</td>
                      <td align="right" style="color:#dc2626;font-size:14px;font-weight:600;padding:4px 0;">${formattedValidUntil}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 40px;">
                  <a href="${signUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;text-decoration:none;padding:18px 40px;border-radius:12px;font-weight:700;font-size:17px;letter-spacing:0.3px;">
                    Offerte bekijken &amp; ondertekenen →
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0 0 8px;">Of kopieer deze link:</p>
            <p style="text-align:center;margin:0 0 32px;">
              <a href="${signUrl}" style="color:#2563eb;font-size:12px;word-break:break-all;">${signUrl}</a>
            </p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              Heeft u vragen over deze offerte? Neem dan gerust contact met ons op.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:32px 48px;text-align:center;">
            <p style="color:white;font-weight:700;font-size:16px;margin:0 0 8px;">${companyName}</p>
            ${companyEmail ? `<p style="color:#64748b;font-size:13px;margin:0 0 4px;">✉️ <a href="mailto:${companyEmail}" style="color:#64748b;text-decoration:none;">${companyEmail}</a></p>` : ''}
            ${companyPhone ? `<p style="color:#64748b;font-size:13px;margin:0 0 4px;">📞 ${companyPhone}</p>` : ''}
            ${companyWebsite ? `<p style="color:#64748b;font-size:13px;margin:0;">🌐 <a href="${companyWebsite}" style="color:#64748b;text-decoration:none;">${companyWebsite}</a></p>` : ''}
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
