import type { Metadata } from 'next'
import { Inter, Oxanium } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ui/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const oxanium = Oxanium({
  subsets: ['latin'],
  variable: '--font-oxanium',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vrijdag.AI — Offerte App',
  description: 'Professionele offertes opstellen, versturen en digitaal ondertekenen',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${oxanium.variable}`}>
      <body style={{ background: '#0a0a0f', color: '#ffffff' }}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
