import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { quoteId, clientEmail, clientName, signUrl, quoteNumber, total, companyName } = await req.json()

  try {
    await resend.emails.send({
      from: `${companyName} <offerte@vrijdag.ai>`,
      to: clientEmail,
      subject: `Offerte ${quoteNumber} van ${companyName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #0f172a; border-radius: 12px; padding: 32px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
            <p style="color: #94a3b8; margin: 8px 0 0;">Offerte ter ondertekening</p>
          </div>
          
          <p style="color: #334155; font-size: 16px;">Beste ${clientName},</p>
          
          <p style="color: #334155;">Hierbij ontvangt u onze offerte <strong>${quoteNumber}</strong> ter waarde van <strong>${total}</strong> incl. BTW.</p>
          
          <p style="color: #334155;">Klik op de knop hieronder om de offerte te bekijken en digitaal te ondertekenen:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${signUrl}" style="background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
              Offerte bekijken & ondertekenen →
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Of kopieer deze link in uw browser:<br>
          <a href="${signUrl}" style="color: #2563eb;">${signUrl}</a></p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">${companyName}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
