import type { Metadata } from 'next'
import './globals.css'
import ToastProvider from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Vrijdag.AI — Offerte App',
  description: 'Professionele offertes opstellen, versturen en digitaal ondertekenen',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
