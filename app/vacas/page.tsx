"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getVacas, salvarVaca, deletarVaca } from "@/lib/data";
import type { Vaca } from "@/types";

function toInputDate(d: string | null | undefined) {
  if (!d) return "";
  return d;
}

export default function VacasPage() {
  const [vacas, setVacas] = useState<Vaca[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [editando, setEditando] = useState<
    Record<number, { numero: string; nome: string; data: string }>
  >({});

  const [novoNumero, setNovoNumero] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaData, setNovaData] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVacas();
      setVacas(data);
      const edits: typeof editando = {};
      data.forEach((v) => {
        edits[v.id] = {
          numero: String(v.numero),
          nome: v.nome,
          data: toInputDate(v.data),
        };
      });
      setEditando(edits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function onChange(id: number, campo: string, val: string) {
    setEditando((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: val } }));
  }

  async function salvar(id: number) {
    setSalvando(id);
    try {
      const v = editando[id];
      await salvarVaca(
        {
          numero: parseInt(v.numero, 10),
          nome: v.nome,
          data: v.data || null,
        },
        id,
      );
      await carregar();
      mostrarToast("Salvo com sucesso!");
    } catch (e) {
      mostrarToast("Erro ao salvar");
      console.error(e);
    } finally {
      setSalvando(null);
    }
  }

  async function adicionar() {
    if (!novoNumero || !novoNome) {
      mostrarToast("Preencha número e nome");
      return;
    }
    setAdicionando(true);
    try {
      await salvarVaca({
        numero: parseInt(novoNumero, 10),
        nome: novoNome,
        data: novaData || null,
      });
      setNovoNumero("");
      setNovoNome("");
      setNovaData("");
      await carregar();
      mostrarToast("Vaca adicionada!");
    } catch (e) {
      mostrarToast("Erro ao adicionar");
      console.error(e);
    } finally {
      setAdicionando(false);
    }
  }

  async function excluir(id: number, nome: string) {
    if (!confirm(`Excluir vaca "${nome}"?`)) return;
    try {
      await deletarVaca(id);
      await carregar();
      mostrarToast("Vaca excluída");
    } catch (e) {
      mostrarToast("Erro ao excluir");
      console.error(e);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Vacas</h1>
        <p>Controle do rebanho — cadastro e gestão de vacas</p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <span className="card-title">Adicionar Vaca</span>
        </div>
        <div className="card-body">
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div className="login-field" style={{ flex: "0 0 100px" }}>
              <label>Nº</label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 1"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
              />
            </div>
            <div className="login-field" style={{ flex: "1 1 180px" }}>
              <label>Nome</label>
              <input
                type="text"
                placeholder="Nome da vaca"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
              />
            </div>
            <div className="login-field" style={{ flex: "0 0 160px" }}>
              <label>Data nascimento/compra</label>
              <input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={adicionando}
              onClick={adicionar}
            >
              {adicionando ? "..." : "Adicionar"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando vacas...</div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="tabela-planilha">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Nº</th>
                  <th style={{ width: "26%" }}>Nome</th>
                  <th style={{ width: "14%" }}>Data nascimento/compra</th>
                  <th style={{ width: "8%" }}>Status</th>
                  <th style={{ width: "28%" }}></th>
                </tr>
              </thead>
              <tbody>
                {vacas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "var(--cinza)",
                        padding: "2rem",
                      }}
                    >
                      Nenhuma vaca cadastrada. Adicione acima.
                    </td>
                  </tr>
                ) : (
                  vacas.map((vaca) => {
                    const v = editando[vaca.id] ?? {
                      numero: "",
                      nome: "",
                      data: "",
                    };
                    return (
                      <tr key={vaca.id}>
                        <td>
                          <input
                            className="input-tabela"
                            type="number"
                            min="1"
                            value={v.numero}
                            onChange={(e) =>
                              onChange(vaca.id, "numero", e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && salvar(vaca.id)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input-tabela"
                            type="text"
                            value={v.nome}
                            onChange={(e) =>
                              onChange(vaca.id, "nome", e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && salvar(vaca.id)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input-tabela"
                            type="date"
                            value={v.data}
                            onChange={(e) =>
                              onChange(vaca.id, "data", e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && salvar(vaca.id)
                            }
                          />
                        </td>
                        <td>
                          {!vaca.ativo ? (
                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                              Vendida
                            </span>
                          ) : (
                            <span className="badge badge-green">Ativa</span>
                          )}
                        </td>
                        <td className="acoes">
                          <a
                            className="btn btn-primary btn-salvar"
                            href={`/vacas/${vaca.id}`}
                          >
                            Ficha
                          </a>
                          <button
                            className="btn btn-primary btn-salvar"
                            disabled={salvando === vaca.id}
                            onClick={() => salvar(vaca.id)}
                          >
                            {salvando === vaca.id ? "..." : "Salvar"}
                          </button>
                          <button
                            className="btn btn-excluir btn-salvar"
                            onClick={() => excluir(vaca.id, vaca.nome)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
