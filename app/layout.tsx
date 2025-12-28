import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lalitha Garments - Customized Clothing & Ready-Made Collections',
  description: 'High-quality customized clothing and ready-made collections. Kurtis, Dresses, Sarees tailored to your needs. Personalized guidance and honest suggestions.',
  keywords: 'customized clothing, kurtis, dresses, sarees, Indian clothing, online clothing store',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

