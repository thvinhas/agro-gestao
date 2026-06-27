import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import NavBar from '@/components/nav-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestão Leiteira',
  description: 'Planilha de custos e receitas para fazenda leiteira',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <NavBar />
          <main className="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
