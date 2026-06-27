import { supabase } from './supabase'
import type { Categoria, Item, Lancamento, LancamentoInput, PlanilhaData, ResultadoMensal } from '@/types'

// Busca todos os itens com suas categorias
export async function getItens(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('itens')
    .select('*, categoria:categorias(*)')
    .eq('ativo', true)
    .order('ordem')

  if (error) throw error
  return data ?? []
}

// Busca categorias
export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem')

  if (error) throw error
  return data ?? []
}

// Busca lançamentos de um mês/ano
export async function getLancamentos(mes: number, ano: number): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*, item:itens(*, categoria:categorias(*))')
    .eq('mes', mes)
    .eq('ano', ano)

  if (error) throw error
  return data ?? []
}

// Salva ou atualiza um lançamento (upsert)
export async function salvarLancamento(input: LancamentoInput): Promise<Lancamento> {
  const { data, error } = await supabase
    .from('lancamentos')
    .upsert(
      {
        item_id: input.item_id,
        mes: input.mes,
        ano: input.ano,
        quantidade: input.quantidade ?? null,
        valor_unitario: input.valor_unitario ?? null,
        custo_total_manual: input.custo_total_manual ?? null,
      },
      { onConflict: 'item_id,mes,ano' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// Monta a estrutura completa da planilha para um mês
export async function getPlanilha(mes: number, ano: number): Promise<PlanilhaData> {
  const [categorias, itens, lancamentos] = await Promise.all([
    getCategorias(),
    getItens(),
    getLancamentos(mes, ano),
  ])

  const lancamentosMap = new Map<number, Lancamento>()
  lancamentos.forEach((l) => lancamentosMap.set(l.item_id, l))

  const planilhaCategorias = categorias.map((categoria) => {
    const itensCategoria = itens.filter((i) => i.categoria_id === categoria.id)
    const itensComLancamento = itensCategoria.map((item) => ({
      item,
      lancamento: lancamentosMap.get(item.id) ?? null,
    }))

    const total = itensComLancamento.reduce((acc, { lancamento }) => {
      return acc + (lancamento?.custo_total ?? 0)
    }, 0)

    return { categoria, itens: itensComLancamento, total }
  })

  const receita_total = planilhaCategorias.find((c) => c.categoria.tipo === 'receita')?.total ?? 0
  const total_custos_variaveis = planilhaCategorias.find((c) => c.categoria.tipo === 'custo_variavel')?.total ?? 0
  const total_custos_fixos = planilhaCategorias.find((c) => c.categoria.tipo === 'custo_fixo')?.total ?? 0
  const lucro_operacional = receita_total - total_custos_variaveis - total_custos_fixos

  // Custo por litro: busca lançamento de venda de leite
  const vendaLeite = lancamentos.find((l) => l.item?.nome === 'Venda de leite')
  const litros_produzidos = vendaLeite?.quantidade ?? undefined
  const custo_por_litro = litros_produzidos
    ? (total_custos_variaveis + total_custos_fixos) / litros_produzidos
    : undefined

  const resultado: ResultadoMensal = {
    receita_total,
    total_custos_variaveis,
    total_custos_fixos,
    lucro_operacional,
    litros_produzidos,
    custo_por_litro,
  }

  return { mes, ano, categorias: planilhaCategorias, resultado }
}

// Histórico dos últimos 12 meses para gráficos
export async function getHistorico(meses = 12) {
  const agora = new Date()
  const resultados = []

  for (let i = meses - 1; i >= 0; i--) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const mes = data.getMonth() + 1
    const ano = data.getFullYear()

    const planilha = await getPlanilha(mes, ano)
    resultados.push({
      mes,
      ano,
      label: `${mes.toString().padStart(2, '0')}/${ano}`,
      ...planilha.resultado,
    })
  }

  return resultados
}
