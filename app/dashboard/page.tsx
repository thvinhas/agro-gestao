'use client'

import { useEffect, useState } from 'react'
import { getHistorico } from '@/lib/data'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts'

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DashboardPage() {
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistorico(12).then(data => {
      setHistorico(data)
      setLoading(false)
    })
  }, [])

  const ultimo = historico[historico.length - 1]
  const penultimo = historico[historico.length - 2]

  function variacao(atual: number, anterior: number) {
    if (!anterior) return null
    return ((atual - anterior) / Math.abs(anterior)) * 100
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral dos últimos 12 meses</p>
      </div>

      {loading ? (
        <div className="loading">Carregando dados...</div>
      ) : (
        <>
          {/* KPIs do mês atual */}
          {ultimo && (
            <div className="kpis">
              {[
                { label: 'Receita (mês atual)', val: ultimo.receita_total, comp: penultimo?.receita_total },
                { label: 'Custos Variáveis', val: ultimo.total_custos_variaveis, comp: penultimo?.total_custos_variaveis },
                { label: 'Custos Fixos', val: ultimo.total_custos_fixos, comp: penultimo?.total_custos_fixos },
                { label: 'Lucro Operacional', val: ultimo.lucro_operacional, comp: penultimo?.lucro_operacional },
              ].map(({ label, val, comp }) => {
                const v = variacao(val, comp)
                return (
                  <div className="kpi" key={label}>
                    <div className="kpi-label">{label}</div>
                    <div className={`kpi-valor ${val < 0 ? 'negativo' : ''}`}>{formatBRL(val)}</div>
                    {v != null && (
                      <div className="kpi-sub">
                        <span className={`badge ${v >= 0 ? 'badge-green' : 'badge-red'}`}>
                          {v >= 0 ? '↑' : '↓'} {Math.abs(v).toFixed(1)}% vs mês ant.
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Gráfico de linhas - Evolução */}
          <div className="card" style={{marginBottom:'1.25rem'}}>
            <div className="card-header">
              <span className="card-title">Evolução Financeira</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{fontSize:11}} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{fontSize:11}} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="receita_total" name="Receita" stroke="#2d6a4f" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lucro_operacional" name="Lucro" stroke="#52b788" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total_custos_variaveis" name="Custos Var." stroke="#e9c46a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total_custos_fixos" name="Custos Fix." stroke="#e63946" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de barras - Receita vs Custo */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Receita × Total de Custos</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{fontSize:11}} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{fontSize:11}} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Bar dataKey="receita_total" name="Receita" fill="#2d6a4f" radius={[4,4,0,0]} />
                  <Bar
                    dataKey="total_custos"
                    name="Total Custos"
                    fill="#e63946"
                    radius={[4,4,0,0]}
                    // Calculado via transform
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </>
  )
}
