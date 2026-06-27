import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestão Leiteira',
  description: 'Planilha de custos e receitas para fazenda leiteira',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <nav className="nav">
          <div className="nav-inner">
            <span className="nav-logo">🐄 Gestão Leiteira</span>
            <div className="nav-links">
              <a href="/dashboard">Dashboard</a>
              <a href="/lancamentos">Lançamentos</a>
            </div>
          </div>
        </nav>
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}
