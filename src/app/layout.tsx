import type { Metadata } from 'next'
import { Inter, Oxanium } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

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
  title: {
    default: 'Vrijdag.AI Offerte',
    template: '%s | Vrijdag.AI Offerte',
  },
  description: 'Professionele offertes maken en versturen voor Vrijdag.AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${oxanium.variable}`}>
      <body style={{ background: '#0a0a0f', color: '#ffffff' }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ToastProvider />
      </body>
    </html>
  )
}
