import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import NavBar from '@/components/nav-bar'
import PWARegister from '@/components/pwa-register'
import OfflineIndicator from '@/components/offline-indicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestão Leiteira',
  description: 'Planilha de custos e receitas para fazenda leiteira',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  other: { 'theme-color': '#2d6a4f' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gestão Leiteira',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <NavBar />
          <OfflineIndicator />
          <main className="main-content">{children}</main>
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  )
}
