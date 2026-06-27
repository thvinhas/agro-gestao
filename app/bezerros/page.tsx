'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { getBezerrosApartados, venderBezerro, vacaFromBezerro } from '@/lib/data'
import { getVacas } from '@/lib/data'
import type { Parto, Vaca, Venda } from '@/types'

function fmtData(d: string | null | undefined) {
  if (!d) return '-'
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}

type PartoComVenda = Parto & { venda?: Venda }

type AcaoModal = {
  parto: PartoComVenda
  tipo: 'vender' | 'virar_vaca'
} | null

export default function BezerrosPage() {
  const [bezerros, setBezerros] = useState<PartoComVenda[]>([])
  const [vacas, setVacas] = useState<Vaca[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [modal, setModal] = useState<AcaoModal>(null)
  const [valorVenda, setValorVenda] = useState('')
  const [arrobaVenda, setArrobaVenda] = useState('')
  const [nomeVaca, setNomeVaca] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [b, v] = await Promise.all([getBezerrosApartados(), getVacas()])
      setBezerros(b)
      setVacas(v)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function abrirVender(parto: PartoComVenda) {
    setModal({ parto, tipo: 'vender' })
    setValorVenda('')
    setArrobaVenda('')
  }

  function abrirVirarVaca(parto: PartoComVenda) {
    setModal({ parto, tipo: 'virar_vaca' })
    setNomeVaca(`Bezerro ${parto.numero_bezerro ?? ''}`.trim())
  }

  async function confirmarVender() {
    if (!modal || modal.tipo !== 'vender') return
    const valor = parseFloat(valorVenda)
    if (!valor || valor <= 0) {
      mostrarToast('Informe um valor válido')
      return
    }
    setProcessando(true)
    try {
      const arroba = arrobaVenda ? parseFloat(arrobaVenda) : null
      await venderBezerro(modal.parto.id, valor, arroba)
      setModal(null)
      await carregar()
      mostrarToast('Bezerro vendido!')
    } catch (e) {
      mostrarToast('Erro ao vender')
      console.error(e)
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarVirarVaca() {
    if (!modal || modal.tipo !== 'virar_vaca') return
    if (!nomeVaca.trim()) {
      mostrarToast('Informe o nome da vaca')
      return
    }
    setProcessando(true)
    try {
      await vacaFromBezerro(modal.parto.id, nomeVaca.trim())
      setModal(null)
      await carregar()
      mostrarToast(`${nomeVaca} adicionada ao rebanho!`)
    } catch (e) {
      mostrarToast('Erro ao converter')
      console.error(e)
    } finally {
      setProcessando(false)
    }
  }

  function vacaNome(vacaId: number | null) {
    if (!vacaId) return '-'
    const v = vacas.find(v => v.id === vacaId)
    return v ? `${v.nome} (Nº ${v.numero})` : '-'
  }

  const pendentes = bezerros.filter(b => b.status_bezerro === 'pendente')
  const historico = bezerros.filter(b => b.status_bezerro !== 'pendente')

  return (
    <>
      <div className="page-header">
        <h1>Bezerros Apartados</h1>
        <p>Gerenciamento de bezerros recém-desmamados</p>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {pendentes.length === 0 && historico.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', color: 'var(--cinza)', padding: '2rem' }}>
                Nenhum bezerro apartado ainda. Registre uma data de apartação na ficha da vaca.
              </div>
            </div>
          ) : (
            <>
              {pendentes.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <span className="card-title">Pendentes ({pendentes.length})</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="tabela-planilha">
                      <thead>
                        <tr>
                          <th>Mãe</th>
                          <th>Nº</th>
                          <th>Sexo</th>
                          <th>Parto</th>
                          <th>Apartação</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendentes.map(p => {
                          const mae = vacas.find(v => v.id === p.vaca_id)
                          return (
                            <tr key={p.id}>
                              <td>{mae ? `${mae.nome} (Nº ${mae.numero})` : '-'}</td>
                              <td>{p.numero_bezerro ?? '-'}</td>
                              <td>{p.sexo_bezerro ?? '-'}</td>
                              <td>{fmtData(p.data_parto)}</td>
                              <td>{fmtData(p.data_apartacao)}</td>
                              <td className="acoes">
                                {p.sexo_bezerro === 'Fêmea' && (
                                  <button
                                    className="btn btn-primary btn-salvar"
                                    onClick={() => abrirVirarVaca(p)}
                                  >
                                    Virar Vaca
                                  </button>
                                )}
                                <button
                                  className="btn btn-ghost btn-salvar"
                                  style={{ borderColor: 'var(--verde)', color: 'var(--verde)' }}
                                  onClick={() => abrirVender(p)}
                                >
                                  Vender
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {historico.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Histórico ({historico.length})</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="tabela-planilha">
                      <thead>
                        <tr>
                          <th>Mãe</th>
                          <th>Nº</th>
                          <th>Sexo</th>
                          <th>Destino</th>
                          <th>Valor</th>
                          <th>@</th>
                          <th>Data Venda</th>
                          <th>Apartação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historico.map(p => {
                          const mae = vacas.find(v => v.id === p.vaca_id)
                          return (
                            <tr key={p.id}>
                              <td>{mae ? `${mae.nome} (Nº ${mae.numero})` : '-'}</td>
                              <td>{p.numero_bezerro ?? '-'}</td>
                              <td>{p.sexo_bezerro ?? '-'}</td>
                              <td>
                                {p.status_bezerro === 'virou_vaca' ? (
                                  <span className="badge badge-green">
                                    Vaca: {vacaNome(p.virou_vaca_id)}
                                  </span>
                                ) : p.status_bezerro === 'vendido' ? (
                                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Vendido
                                  </span>
                                ) : '-'}
                              </td>
                              <td>{p.venda ? `R$ ${p.venda.valor.toFixed(2)}` : '-'}</td>
                              <td>{p.venda?.arroba != null ? `${p.venda.arroba}@` : '-'}</td>
                              <td>{fmtData(p.venda?.data_venda)}</td>
                              <td>{fmtData(p.data_apartacao)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => !processando && setModal(null)}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              {modal.tipo === 'vender' ? 'Vender Bezerro' : 'Transformar em Vaca'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: '1.25rem' }}>
              Bezerro Nº {modal.parto.numero_bezerro ?? '-'} — {fmtData(modal.parto.data_apartacao)}
            </p>

            {modal.tipo === 'vender' ? (
              <>
                <div className="login-field" style={{ marginBottom: '1rem' }}>
                  <label>Valor da Venda (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 1500.00"
                    value={valorVenda}
                    onChange={e => setValorVenda(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmarVender()}
                    autoFocus
                  />
                </div>
                <div className="login-field" style={{ marginBottom: '1rem' }}>
                  <label>Arroba (@)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Ex: 7.5"
                    value={arrobaVenda}
                    onChange={e => setArrobaVenda(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmarVender()}
                  />
                </div>
              </>
            ) : (
              <div className="login-field" style={{ marginBottom: '1rem' }}>
                <label>Nome da Nova Vaca</label>
                <input
                  type="text"
                  placeholder="Nome da vaca"
                  value={nomeVaca}
                  onChange={e => setNomeVaca(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmarVirarVaca()}
                  autoFocus
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setModal(null)}
                disabled={processando}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={processando}
                onClick={modal.tipo === 'vender' ? confirmarVender : confirmarVirarVaca}
              >
                {processando ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
