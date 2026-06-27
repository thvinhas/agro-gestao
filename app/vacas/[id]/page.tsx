'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVacas, salvarVaca, venderVaca, getVendas } from '@/lib/data'
import { getPartos, salvarParto, deletarParto, atualizarApartacao } from '@/lib/data'
import { getProducaoLeite, salvarProducaoLeite, deletarProducaoLeite } from '@/lib/data'
import { getCios, salvarCio, deletarCio } from '@/lib/data'
import type { Vaca, Parto, ProducaoLeite, Cio, Venda } from '@/types'

function toInputDate(d: string | null | undefined) {
  if (!d) return ''
  return d
}

function fmtData(d: string | null | undefined) {
  if (!d) return '-'
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function FichaVacaPage() {
  const params = useParams()
  const router = useRouter()
  const vacaId = Number(params.id)

  const [vaca, setVaca] = useState<Vaca | null>(null)
  const [partos, setPartos] = useState<Parto[]>([])
  const [producao, setProducao] = useState<ProducaoLeite[]>([])
  const [cios, setCios] = useState<Cio[]>([])
  const [venda, setVenda] = useState<Venda | null>(null)

  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [observacoes, setObservacoes] = useState('')
  const [salvandoObs, setSalvandoObs] = useState(false)

  const [novoParto, setNovoParto] = useState({ data_parto: '', sexo_bezerro: '', numero_bezerro: '' })
  const [adicionandoParto, setAdicionandoParto] = useState(false)
  const [editandoApartacao, setEditandoApartacao] = useState<number | null>(null)
  const [apartacaoValue, setApartacaoValue] = useState('')
  const [salvandoApartacao, setSalvandoApartacao] = useState(false)

  const [quantidadeLeite, setQuantidadeLeite] = useState('')
  const [adicionandoLeite, setAdicionandoLeite] = useState(false)

  const [novoCio, setNovoCio] = useState({ data_cio: '', observacao: '' })
  const [adicionandoCio, setAdicionandoCio] = useState(false)

  const [modalVender, setModalVender] = useState(false)
  const [venderValor, setVenderValor] = useState('')
  const [venderArroba, setVenderArroba] = useState('')
  const [venderProcessando, setVenderProcessando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const vacas = await getVacas()
      const v = vacas.find(v => v.id === vacaId) ?? null
      setVaca(v)
      if (v) {
        setObservacoes(v.observacoes ?? '')
        const vendas = await getVendas('vaca', v.id)
        setVenda(vendas[0] ?? null)
      }
      if (!v) mostrarToast('Vaca não encontrada')
    } catch (e) {
      console.error(e)
      mostrarToast('Erro ao carregar vaca')
      setLoading(false)
      return
    }
    try {
      const [p, pl, c] = await Promise.all([
        getPartos(vacaId),
        getProducaoLeite(vacaId),
        getCios(vacaId),
      ])
      setPartos(p)
      setProducao(pl)
      setCios(c)
    } catch (e) {
      console.error(e)
      mostrarToast('Erro ao carregar dados complementares')
    } finally {
      setLoading(false)
    }
  }, [vacaId])

  useEffect(() => { carregar() }, [carregar])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function salvarObservacoes() {
    if (!vaca) return
    setSalvandoObs(true)
    try {
      await salvarVaca({ numero: vaca.numero, nome: vaca.nome, data: vaca.data, observacoes }, vaca.id)
      await carregar()
      mostrarToast('Observações salvas!')
    } catch (e) {
      mostrarToast('Erro ao salvar')
      console.error(e)
    } finally {
      setSalvandoObs(false)
    }
  }

  async function adicionarParto() {
    if (!novoParto.data_parto) {
      mostrarToast('Informe a data do parto')
      return
    }
    setAdicionandoParto(true)
    try {
      await salvarParto({
        vaca_id: vacaId,
        data_parto: novoParto.data_parto,
        sexo_bezerro: novoParto.sexo_bezerro || null,
        numero_bezerro: novoParto.numero_bezerro ? parseInt(novoParto.numero_bezerro, 10) : null,
      })
      setNovoParto({ data_parto: '', sexo_bezerro: '', numero_bezerro: '' })
      await carregar()
      mostrarToast('Parto adicionado!')
    } catch (e) {
      mostrarToast('Erro ao adicionar')
      console.error(e)
    } finally {
      setAdicionandoParto(false)
    }
  }

  function iniciarApartacao(parto: Parto) {
    setEditandoApartacao(parto.id)
    setApartacaoValue(toInputDate(parto.data_apartacao))
  }

  async function confirmarApartacao() {
    if (editandoApartacao == null) return
    setSalvandoApartacao(true)
    try {
      await atualizarApartacao(editandoApartacao, apartacaoValue || null)
      setEditandoApartacao(null)
      await carregar()
      mostrarToast('Apartação registrada!')
    } catch (e) {
      mostrarToast('Erro ao salvar')
      console.error(e)
    } finally {
      setSalvandoApartacao(false)
    }
  }

  async function excluirParto(id: number) {
    if (!confirm('Excluir este parto?')) return
    try {
      await deletarParto(id)
      await carregar()
      mostrarToast('Parto excluído')
    } catch (e) {
      mostrarToast('Erro ao excluir')
      console.error(e)
    }
  }

  async function adicionarLeite() {
    if (!quantidadeLeite) {
      mostrarToast('Informe a quantidade')
      return
    }
    setAdicionandoLeite(true)
    try {
      await salvarProducaoLeite({
        vaca_id: vacaId,
        quantidade: parseFloat(quantidadeLeite),
      })
      setQuantidadeLeite('')
      await carregar()
      mostrarToast('Produção registrada!')
    } catch (e) {
      mostrarToast('Erro ao registrar')
      console.error(e)
    } finally {
      setAdicionandoLeite(false)
    }
  }

  async function excluirLeite(id: number) {
    if (!confirm('Excluir este registro?')) return
    try {
      await deletarProducaoLeite(id)
      await carregar()
      mostrarToast('Registro excluído')
    } catch (e) {
      mostrarToast('Erro ao excluir')
      console.error(e)
    }
  }

  async function adicionarCio() {
    if (!novoCio.data_cio) {
      mostrarToast('Informe a data do cio')
      return
    }
    setAdicionandoCio(true)
    try {
      await salvarCio({
        vaca_id: vacaId,
        data_cio: novoCio.data_cio,
        observacao: novoCio.observacao || null,
      })
      setNovoCio({ data_cio: '', observacao: '' })
      await carregar()
      mostrarToast('Cio registrado!')
    } catch (e) {
      mostrarToast('Erro ao registrar')
      console.error(e)
    } finally {
      setAdicionandoCio(false)
    }
  }

  async function excluirCio(id: number) {
    if (!confirm('Excluir este registro?')) return
    try {
      await deletarCio(id)
      await carregar()
      mostrarToast('Cio excluído')
    } catch (e) {
      mostrarToast('Erro ao excluir')
      console.error(e)
    }
  }

  async function confirmarVenderVaca() {
    const valor = parseFloat(venderValor)
    if (!valor || valor <= 0) {
      mostrarToast('Informe um valor válido')
      return
    }
    setVenderProcessando(true)
    try {
      const arroba = venderArroba ? parseFloat(venderArroba) : null
      await venderVaca(vacaId, valor, arroba)
      setModalVender(false)
      router.push('/vacas')
    } catch (e) {
      mostrarToast('Erro ao vender')
      console.error(e)
    } finally {
      setVenderProcessando(false)
    }
  }

  const totalLeite = producao.reduce((acc, p) => acc + p.quantidade, 0)
  const mediaLeite = producao.length > 0 ? (totalLeite / producao.length).toFixed(1) : '-'

  if (loading) {
    return <div className="loading">Carregando ficha...</div>
  }

  if (!vaca) {
    return <div className="loading">Vaca não encontrada</div>
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/vacas')}>
            ← Voltar
          </button>
          <h1>{vaca.nome}</h1>
          <span className="badge badge-green">Nº {vaca.numero}</span>
          {vaca.ativo && (
            <button
              className="btn btn-primary btn-salvar"
              style={{ marginLeft: 'auto' }}
              onClick={() => { setVenderValor(''); setVenderArroba(''); setModalVender(true) }}
            >
              Vender
            </button>
          )}
        </div>
        <p style={{ marginTop: '0.25rem' }}>Ficha individual da vaca</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Dados da Vaca</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="login-field">
                <label>Número</label>
                <input type="text" value={String(vaca.numero)} disabled />
              </div>
              <div className="login-field">
                <label>Nome</label>
                <input type="text" value={vaca.nome} disabled />
              </div>
              <div className="login-field">
                <label>Data</label>
                <input type="text" value={fmtData(vaca.data)} disabled />
              </div>
              <div className="login-field">
                <label>Observações</label>
                <textarea
                  rows={3}
                  style={{
                    padding: '0.65rem 0.85rem',
                    border: '1px solid var(--borda)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--texto)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={salvandoObs}
                onClick={salvarObservacoes}
              >
                {salvandoObs ? '...' : 'Salvar Observações'}
              </button>
              {!vaca.ativo && (
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Vendida</span>
                  </div>
                  {venda && (
                    <>
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        <strong>Valor:</strong> R$ {venda.valor.toFixed(2)}
                      </p>
                      {venda.arroba && (
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                          <strong>Arroba:</strong> {venda.arroba} @
                        </p>
                      )}
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        <strong>Data da venda:</strong> {fmtData(venda.data_venda)}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Produção de Leite</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--cinza)' }}>
              Total: {totalLeite.toFixed(1)} L
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div className="login-field" style={{ flex: '1' }}>
                <label>Litros</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 25.5"
                  value={quantidadeLeite}
                  onChange={e => setQuantidadeLeite(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarLeite()}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={adicionandoLeite}
                onClick={adicionarLeite}
              >
                {adicionandoLeite ? '...' : 'Registrar'}
              </button>
            </div>
            {producao.length === 0 ? (
              <p style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>Nenhum registro ainda</p>
            ) : (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--cinza)', marginBottom: '0.5rem' }}>
                  Média: <strong>{mediaLeite}</strong> L por registro
                </p>
                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  <table className="tabela-planilha" style={{ minWidth: 'auto', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Data</th>
                        <th style={{ width: '30%' }}>Litros</th>
                        <th style={{ width: '30%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {producao.map(p => {
                        const data = new Date(p.created_at)
                        const label = data.toLocaleDateString('pt-BR')
                        return (
                          <tr key={p.id}>
                            <td>{label}</td>
                            <td>{p.quantidade.toFixed(1)}</td>
                            <td className="acoes">
                              <button
                                className="btn btn-excluir btn-salvar"
                                onClick={() => excluirLeite(p.id)}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Partos</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
              <div className="login-field">
                <label>Data do Parto</label>
                <input
                  type="date"
                  value={novoParto.data_parto}
                  onChange={e => setNovoParto(p => ({ ...p, data_parto: e.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Sexo do Bezerro</label>
                <select
                  style={{
                    padding: '0.65rem 0.85rem',
                    border: '1px solid var(--borda)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--texto)',
                    fontFamily: 'inherit',
                  }}
                  value={novoParto.sexo_bezerro}
                  onChange={e => setNovoParto(p => ({ ...p, sexo_bezerro: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
              <div className="login-field">
                <label>Nº do Bezerro</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 101"
                  value={novoParto.numero_bezerro}
                  onChange={e => setNovoParto(p => ({ ...p, numero_bezerro: e.target.value }))}
                />
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginBottom: '1rem', width: '100%' }}
              disabled={adicionandoParto}
              onClick={adicionarParto}
            >
              {adicionandoParto ? '...' : 'Adicionar Parto'}
            </button>
            {partos.length === 0 ? (
              <p style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>Nenhum parto registrado</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="tabela-planilha" style={{ minWidth: 'auto', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Parto</th>
                      <th>Sexo</th>
                      <th>Nº</th>
                      <th>Apartação</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partos.map(p => (
                      <tr key={p.id}>
                        <td>{fmtData(p.data_parto)}</td>
                        <td>{p.sexo_bezerro ?? '-'}</td>
                        <td>{p.numero_bezerro ?? '-'}</td>
                        <td>
                          {editandoApartacao === p.id ? (
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                              <input
                                type="date"
                                value={apartacaoValue}
                                onChange={e => setApartacaoValue(e.target.value)}
                                style={{
                                  padding: '0.25rem 0.4rem',
                                  border: '1px solid var(--borda)',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <button
                                className="btn btn-primary btn-salvar"
                                disabled={salvandoApartacao}
                                onClick={confirmarApartacao}
                              >
                                OK
                              </button>
                              <button
                                className="btn btn-ghost btn-salvar"
                                onClick={() => setEditandoApartacao(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <span style={{ cursor: 'pointer' }} onClick={() => iniciarApartacao(p)}>
                              {p.data_apartacao ? fmtData(p.data_apartacao) : (
                                <span className="badge badge-green">Apartar</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="acoes">
                          <button
                            className="btn btn-excluir btn-salvar"
                            onClick={() => excluirParto(p.id)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Cios</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div className="login-field" style={{ flex: '1' }}>
                <label>Data do Cio</label>
                <input
                  type="date"
                  value={novoCio.data_cio}
                  onChange={e => setNovoCio(c => ({ ...c, data_cio: e.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={adicionandoCio}
                onClick={adicionarCio}
              >
                {adicionandoCio ? '...' : 'Adicionar'}
              </button>
            </div>
            <div className="login-field" style={{ marginBottom: '1rem' }}>
              <label>Observação</label>
              <input
                type="text"
                placeholder="Ex: Cio forte, inseminada"
                value={novoCio.observacao}
                onChange={e => setNovoCio(c => ({ ...c, observacao: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && adicionarCio()}
              />
            </div>
            {cios.length === 0 ? (
              <p style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>Nenhum cio registrado</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="tabela-planilha" style={{ minWidth: 'auto', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Observação</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cios.map(c => (
                      <tr key={c.id}>
                        <td>{fmtData(c.data_cio)}</td>
                        <td>{c.observacao ?? '-'}</td>
                        <td className="acoes">
                          <button
                            className="btn btn-excluir btn-salvar"
                            onClick={() => excluirCio(c.id)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalVender && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => !venderProcessando && setModalVender(false)}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              Vender {vaca.nome}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--cinza)', marginBottom: '1.25rem' }}>
              Nº {vaca.numero}
            </p>

            <div className="login-field" style={{ marginBottom: '1rem' }}>
              <label>Valor da Venda (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 5000.00"
                value={venderValor}
                onChange={e => setVenderValor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarVenderVaca()}
                autoFocus
              />
            </div>
            <div className="login-field" style={{ marginBottom: '1rem' }}>
              <label>Arroba (@)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 18"
                value={venderArroba}
                onChange={e => setVenderArroba(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarVenderVaca()}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setModalVender(false)}
                disabled={venderProcessando}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={venderProcessando}
                onClick={confirmarVenderVaca}
              >
                {venderProcessando ? '...' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
