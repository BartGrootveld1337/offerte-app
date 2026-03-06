import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Offerte App — Break the Norm',
  description: 'Offertes opstellen, versturen en digitaal ondertekenen',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
