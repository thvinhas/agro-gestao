'use client'

import { useAuth } from '@/lib/auth-context'

export default function NavBar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-logo">Gestão Leiteira</span>
        <div className="nav-links">
          {user ? (
            <>
              <a href="/vacas">Vacas</a>
              <a href="/bezerros">Bezerros</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/lancamentos">Lançamentos</a>
              <span className="nav-user">{user.email}</span>
              <button className="btn-logout" onClick={signOut}>Sair</button>
            </>
          ) : (
            <a href="/login">Entrar</a>
          )}
        </div>
      </div>
    </nav>
  )
}
