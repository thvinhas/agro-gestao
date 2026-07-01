import { supabase } from './supabase'
import type { Categoria, Item, Lancamento, LancamentoInput, PlanilhaData, ResultadoMensal, Vaca, VacaInput, Parto, PartoInput, ProducaoLeite, ProducaoLeiteInput, Cio, CioInput, Venda } from '@/types'

export async function getItens(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('itens')
    .select('*, categoria:categorias(*)')
    .eq('ativo', true)
    .order('ordem')

  if (error) throw error
  return data ?? []
}

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem')

  if (error) throw error
  return data ?? []
}

export async function getVendas(animalType?: 'vaca' | 'bezerro', animalId?: number): Promise<Venda[]> {
  let query = supabase.from('vendas').select('*').order('data_venda', { ascending: false })
  if (animalType) query = query.eq('animal_type', animalType)
  if (animalId) query = query.eq('animal_id', animalId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getLancamentos(mes: number, ano: number): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*, item:itens(*, categoria:categorias(*))')
    .eq('mes', mes)
    .eq('ano', ano)

  if (error) throw error
  return data ?? []
}

export async function salvarLancamento(input: LancamentoInput): Promise<Lancamento> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('lancamentos')
    .upsert(
      {
        item_id: input.item_id,
        user_id: user.id,
        mes: input.mes,
        ano: input.ano,
        quantidade: input.quantidade ?? null,
        valor_unitario: input.valor_unitario ?? null,
        custo_total_manual: input.custo_total_manual ?? null,
      },
      { onConflict: 'item_id,mes,ano,user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

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

export async function getVacas(): Promise<Vaca[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('vacas')
    .select('*')
    .eq('user_id', user.id)
    .order('numero')

  if (error) throw error
  return data ?? []
}

export async function salvarVaca(input: VacaInput, id?: number): Promise<Vaca> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const record: Record<string, unknown> = {
    numero: input.numero,
    user_id: user.id,
    nome: input.nome,
    data: input.data ?? null,
    observacoes: input.observacoes ?? null,
  }

  let query
  if (id) {
    query = supabase.from('vacas').update(record).eq('id', id).select().single()
  } else {
    query = supabase.from('vacas').insert(record).select().single()
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function deletarVaca(id: number): Promise<void> {
  const { error } = await supabase
    .from('vacas')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

// ─── Partos ──────────────────────────────────────────────

export async function getPartos(vacaId: number): Promise<Parto[]> {
  const { data, error } = await supabase
    .from('partos')
    .select('*')
    .eq('vaca_id', vacaId)
    .order('data_parto', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function salvarParto(input: PartoInput, id?: number): Promise<Parto> {
  const record: Record<string, unknown> = {
    vaca_id: input.vaca_id,
    data_parto: input.data_parto,
    sexo_bezerro: input.sexo_bezerro ?? null,
    numero_bezerro: input.numero_bezerro ?? null,
    data_apartacao: input.data_apartacao ?? null,
  }

  if (!id) {
    const { data: maxData } = await supabase
      .from('partos')
      .select('numero_parto')
      .eq('vaca_id', input.vaca_id)
      .order('numero_parto', { ascending: false })
      .limit(1)

    const nextNumero = (maxData?.[0]?.numero_parto ?? 0) + 1
    record.numero_parto = nextNumero
  }

  let query
  if (id) {
    query = supabase.from('partos').update(record).eq('id', id).select().single()
  } else {
    query = supabase.from('partos').insert(record).select().single()
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBezerrosApartados(): Promise<(Parto & { venda?: Venda })[]> {
  const { data: partos, error } = await supabase
    .from('partos')
    .select('*')
    .not('data_apartacao', 'is', null)
    .order('data_apartacao', { ascending: false })

  if (error) throw error

  const vendas = await getVendas('bezerro')
  const vendasMap = new Map<number, Venda>()
  vendas.forEach(v => vendasMap.set(v.animal_id, v))

  return (partos ?? []).map(p => ({
    ...p,
    venda: vendasMap.get(p.id),
  }))
}

function mesRange(mes: number, ano: number) {
  const start = `${ano}-${String(mes).padStart(2, '0')}-01`
  const next = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  return { start, end: next }
}

async function upsertLancamentoVenda(userId: string, mes: number, ano: number): Promise<void> {
  const { data: itens } = await supabase.from('itens').select('id, nome')
  const itemVenda = (itens ?? []).find(i => i.nome?.toLowerCase().includes('animais'))
  if (!itemVenda) throw new Error('Item "Venda de animais" não encontrado')

  const { start, end } = mesRange(mes, ano)
  const { data: vendas } = await supabase
    .from('vendas')
    .select('valor')
    .gte('data_venda', start)
    .lt('data_venda', end)

  const totalVendas = (vendas ?? []).reduce((acc, v) => acc + v.valor, 0)

  const { error } = await supabase
    .from('lancamentos')
    .upsert(
      {
        item_id: itemVenda.id,
        user_id: userId,
        mes,
        ano,
        quantidade: (vendas ?? []).length,
        valor_unitario: null,
        custo_total_manual: totalVendas,
      },
      { onConflict: 'item_id,mes,ano,user_id' }
    )

  if (error) throw error
}

export async function venderBezerro(partoId: number, valor: number, arroba: number | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hoje = new Date().toISOString().split('T')[0]
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { error: vendaError } = await supabase.from('vendas').insert({
    animal_type: 'bezerro',
    animal_id: partoId,
    valor,
    arroba,
    data_venda: hoje,
  })

  if (vendaError) throw vendaError

  await upsertLancamentoVenda(user.id, mes, ano)

  const { error } = await supabase
    .from('partos')
    .update({ status_bezerro: 'vendido' })
    .eq('id', partoId)

  if (error) throw error
}

export async function venderVaca(vacaId: number, valor: number, arroba: number | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hoje = new Date().toISOString().split('T')[0]
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { error: vendaError } = await supabase.from('vendas').insert({
    animal_type: 'vaca',
    animal_id: vacaId,
    valor,
    arroba,
    data_venda: hoje,
  })

  if (vendaError) throw vendaError

  await upsertLancamentoVenda(user.id, mes, ano)

  const { error } = await supabase
    .from('vacas')
    .update({ ativo: false })
    .eq('id', vacaId)

  if (error) throw error
}

export async function vacaFromBezerro(partoId: number, nome: string): Promise<Vaca> {
  const { data: parto } = await supabase
    .from('partos')
    .select('*')
    .eq('id', partoId)
    .single()

  if (!parto) throw new Error('Parto não encontrado')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: vaca, error: vacaError } = await supabase
    .from('vacas')
    .insert({
      numero: parto.numero_bezerro ?? 0,
      nome,
      data: parto.data_parto,
      user_id: user.id,
    })
    .select()
    .single()

  if (vacaError) throw vacaError

  const { error } = await supabase
    .from('partos')
    .update({ status_bezerro: 'virou_vaca', virou_vaca_id: vaca.id })
    .eq('id', partoId)

  if (error) throw error

  return vaca
}

export async function atualizarApartacao(id: number, data: string | null): Promise<void> {
  const { error } = await supabase
    .from('partos')
    .update({ data_apartacao: data })
    .eq('id', id)

  if (error) throw error
}

export async function deletarParto(id: number): Promise<void> {
  const { error } = await supabase.from('partos').delete().eq('id', id)
  if (error) throw error
}

// ─── Produção de Leite ────────────────────────────────────

export async function getProducaoLeite(vacaId: number): Promise<ProducaoLeite[]> {
  const { data, error } = await supabase
    .from('producao_leite')
    .select('*')
    .eq('vaca_id', vacaId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function salvarProducaoLeite(input: ProducaoLeiteInput): Promise<ProducaoLeite> {
  const { data, error } = await supabase
    .from('producao_leite')
    .insert({ vaca_id: input.vaca_id, quantidade: input.quantidade })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletarProducaoLeite(id: number): Promise<void> {
  const { error } = await supabase.from('producao_leite').delete().eq('id', id)
  if (error) throw error
}

// ─── Cios ─────────────────────────────────────────────────

export async function getCios(vacaId: number): Promise<Cio[]> {
  const { data, error } = await supabase
    .from('cios')
    .select('*')
    .eq('vaca_id', vacaId)
    .order('data_cio', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function salvarCio(input: CioInput): Promise<Cio> {
  const { data, error } = await supabase
    .from('cios')
    .insert({
      vaca_id: input.vaca_id,
      data_cio: input.data_cio,
      observacao: input.observacao ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletarCio(id: number): Promise<void> {
  const { error } = await supabase.from('cios').delete().eq('id', id)
  if (error) throw error
}

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
