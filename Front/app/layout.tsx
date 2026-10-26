import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import AuthGuard from "@/components/organisms/auth-guard"
import { Toaster } from "@/components/molecules/sonner"
import { LanguageProvider } from "@/lib/i18n"
import './globals.css'
import './admin/admin.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ImmoConnect',
  description: 'Connectez-vous à votre espace immobilier ImmoConnect.',
  generator: 'v0.app',
  icons: {
    icon: '/logo-app.avif',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${inter.className} bg-background`}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </LanguageProvider>
      </body>
    </html>
  )
}
