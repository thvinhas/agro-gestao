'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo] = useState<'login' | 'signup'>('login')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const err = modo === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    setCarregando(false)

    if (err) {
      setErro(err)
    } else {
      router.push('/lancamentos')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Gestão Leiteira</h1>
          <p>{modo === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              required
              placeholder="mín. 6 caracteres"
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button className="btn btn-primary login-btn" type="submit" disabled={carregando}>
            {carregando ? '...' : (modo === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        <p className="login-toggle">
          {modo === 'login' ? (
            <>Não tem conta? <button className="link-btn" onClick={() => { setModo('signup'); setErro(null) }}>Criar conta</button></>
          ) : (
            <>Já tem conta? <button className="link-btn" onClick={() => { setModo('login'); setErro(null) }}>Fazer login</button></>
          )}
        </p>
      </div>
    </div>
  )
}
