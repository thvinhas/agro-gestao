'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { getPlanilha, salvarLancamento } from '@/lib/data'
import type { PlanilhaData, LancamentoInput } from '@/types'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatBRL(v: number | null | undefined) {
  if (v == null) return '-'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNum(v: number | null | undefined) {
  if (v == null) return ''
  return String(v)
}

export default function LancamentosPage() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [planilha, setPlanilha] = useState<PlanilhaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Valores editados localmente antes de salvar
  const [valores, setValores] = useState<Record<number, { quantidade?: string; valor_unitario?: string; custo_total_manual?: string }>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlanilha(mes, ano)
      setPlanilha(data)
      // Preenche valores com o que já existe no banco
      const v: typeof valores = {}
      data.categorias.forEach(cat => {
        cat.itens.forEach(({ item, lancamento }) => {
          if (lancamento) {
            v[item.id] = {
              quantidade: lancamento.quantidade != null ? String(lancamento.quantidade) : '',
              valor_unitario: lancamento.valor_unitario != null ? String(lancamento.valor_unitario) : '',
              custo_total_manual: lancamento.custo_total_manual != null ? String(lancamento.custo_total_manual) : '',
            }
          }
        })
      })
      setValores(v)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => { carregar() }, [carregar])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function salvar(itemId: number, temQuantidade: boolean) {
    setSalvando(itemId)
    try {
      const v = valores[itemId] ?? {}
      const input: LancamentoInput = {
        item_id: itemId,
        mes,
        ano,
        quantidade: v.quantidade ? parseFloat(v.quantidade) : null,
        valor_unitario: v.valor_unitario ? parseFloat(v.valor_unitario) : null,
        custo_total_manual: !temQuantidade && v.custo_total_manual ? parseFloat(v.custo_total_manual) : null,
      }
      await salvarLancamento(input)
      await carregar()
      mostrarToast('Salvo com sucesso!')
    } catch (e) {
      mostrarToast('Erro ao salvar')
      console.error(e)
    } finally {
      setSalvando(null)
    }
  }

  function onChange(itemId: number, campo: string, val: string) {
    setValores(prev => ({ ...prev, [itemId]: { ...prev[itemId], [campo]: val } }))
  }

  function calcPreview(itemId: number) {
    const v = valores[itemId] ?? {}
    const qty = parseFloat(v.quantidade ?? '')
    const vUnit = parseFloat(v.valor_unitario ?? '')
    if (!isNaN(qty) && !isNaN(vUnit)) return qty * vUnit
    return null
  }

  const anos = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  return (
    <>
      <div className="page-header">
        <h1>Lançamento de Dados</h1>
        <p>Registre receitas e custos mensais da fazenda</p>
      </div>

      <div className="periodo-selector">
        <select value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(Number(e.target.value))}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>
          {loading ? 'Carregando...' : `Período: ${MESES[mes-1]}/${ano}`}
        </span>
      </div>

      {loading ? (
        <div className="loading">Carregando planilha...</div>
      ) : planilha && (
        <>
          {/* KPIs */}
          <div className="kpis">
            <div className="kpi">
              <div className="kpi-label">Receita Total</div>
              <div className="kpi-valor">{formatBRL(planilha.resultado.receita_total)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Custos Variáveis</div>
              <div className="kpi-valor" style={{color:'var(--cinza)'}}>{formatBRL(planilha.resultado.total_custos_variaveis)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Custos Fixos</div>
              <div className="kpi-valor" style={{color:'var(--cinza)'}}>{formatBRL(planilha.resultado.total_custos_fixos)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Lucro Operacional</div>
              <div className={`kpi-valor ${planilha.resultado.lucro_operacional < 0 ? 'negativo' : ''}`}>
                {formatBRL(planilha.resultado.lucro_operacional)}
              </div>
              {planilha.resultado.custo_por_litro != null && (
                <div className="kpi-sub">R$ {planilha.resultado.custo_por_litro.toFixed(2)}/litro</div>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="card">
            <div className="table-wrapper">
            <table className="tabela-planilha">
              <thead>
                <tr>
                  <th style={{width:'35%'}}>Item</th>
                  <th style={{width:'8%'}} className="hide-mobile">Unidade</th>
                  <th style={{width:'13%'}}>Quantidade</th>
                  <th style={{width:'13%'}}>Valor Unit. (R$)</th>
                  <th style={{width:'13%'}}>Custo Total (R$)</th>
                  <th style={{width:'9%'}}></th>
                </tr>
              </thead>
              <tbody>
                {planilha.categorias.map(({ categoria, itens, total }) => (
                  <React.Fragment key={`cat-${categoria.id}`}>
                    <tr className="row-categoria">
                      <td colSpan={6}>{categoria.nome}</td>
                    </tr>
                    {itens.map(({ item, lancamento }) => {
                      const v = valores[item.id] ?? {}
                      const preview = item.tem_quantidade ? calcPreview(item.id) : null
                      const totalExibido = lancamento?.custo_total

                      return (
                        <tr key={item.id}>
                          <td style={{paddingLeft:'1.5rem'}}>{item.nome}</td>
                          <td style={{color:'var(--cinza)',fontSize:'0.8rem'}} className="hide-mobile">{item.unidade ?? '-'}</td>
                          <td>
                            {item.tem_quantidade ? (
                              <input
                                className="input-tabela"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0"
                                value={v.quantidade ?? ''}
                                onChange={e => onChange(item.id, 'quantidade', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && salvar(item.id, item.tem_quantidade)}
                              />
                            ) : <span style={{color:'var(--cinza)',fontSize:'0.8rem'}}>-</span>}
                          </td>
                          <td>
                            {item.tem_quantidade ? (
                              <input
                                className="input-tabela"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0,00"
                                value={v.valor_unitario ?? ''}
                                onChange={e => onChange(item.id, 'valor_unitario', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && salvar(item.id, item.tem_quantidade)}
                              />
                            ) : <span style={{color:'var(--cinza)',fontSize:'0.8rem'}}>-</span>}
                          </td>
                          <td>
                            {item.tem_quantidade ? (
                              <span style={{fontWeight: preview != null ? 600 : 400}}>
                                {preview != null ? formatBRL(preview) : (totalExibido ? formatBRL(totalExibido) : '-')}
                              </span>
                            ) : (
                              <input
                                className="input-tabela"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0,00"
                                value={v.custo_total_manual ?? ''}
                                onChange={e => onChange(item.id, 'custo_total_manual', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && salvar(item.id, item.tem_quantidade)}
                              />
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-salvar"
                              disabled={salvando === item.id}
                              onClick={() => salvar(item.id, item.tem_quantidade)}
                            >
                              {salvando === item.id ? '...' : 'Salvar'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="row-total">
                      <td colSpan={4}>Total {categoria.nome}</td>
                      <td>{formatBRL(total)}</td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                ))}

                {/* Resultado */}
                <tr className="row-categoria">
                  <td colSpan={6}>Resultado</td>
                </tr>
                <tr className="row-resultado">
                  <td style={{paddingLeft:'1.5rem'}}>Receita Total</td>
                  <td colSpan={3}></td>
                  <td>{formatBRL(planilha.resultado.receita_total)}</td>
                  <td></td>
                </tr>
                <tr className="row-resultado">
                  <td style={{paddingLeft:'1.5rem'}}>(-) Custos Variáveis</td>
                  <td colSpan={3}></td>
                  <td>({formatBRL(planilha.resultado.total_custos_variaveis)})</td>
                  <td></td>
                </tr>
                <tr className="row-resultado">
                  <td style={{paddingLeft:'1.5rem'}}>(-) Custos Fixos</td>
                  <td colSpan={3}></td>
                  <td>({formatBRL(planilha.resultado.total_custos_fixos)})</td>
                  <td></td>
                </tr>
                <tr className={`row-lucro ${planilha.resultado.lucro_operacional < 0 ? 'negativo' : ''}`}>
                  <td>Lucro Operacional</td>
                  <td colSpan={3}></td>
                  <td>{formatBRL(planilha.resultado.lucro_operacional)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
