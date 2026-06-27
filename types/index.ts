export type TipoCategoria = 'receita' | 'custo_variavel' | 'custo_fixo'

export interface Categoria {
  id: number
  nome: string
  tipo: TipoCategoria
  ordem: number
}

export interface Item {
  id: number
  categoria_id: number
  nome: string
  unidade: string | null
  tem_quantidade: boolean
  ordem: number
  ativo: boolean
  categoria?: Categoria
}

export interface Lancamento {
  id: string
  item_id: number
  user_id: string
  mes: number
  ano: number
  quantidade: number | null
  valor_unitario: number | null
  custo_total: number | null
  custo_total_manual: number | null
  created_at: string
  updated_at: string
  item?: Item
}

export interface LancamentoInput {
  item_id: number
  mes: number
  ano: number
  quantidade?: number | null
  valor_unitario?: number | null
  custo_total_manual?: number | null
}

export interface ResultadoMensal {
  receita_total: number
  total_custos_variaveis: number
  total_custos_fixos: number
  lucro_operacional: number
  custo_por_litro?: number
  litros_produzidos?: number
}

export interface PlanilhaData {
  mes: number
  ano: number
  categorias: {
    categoria: Categoria
    itens: {
      item: Item
      lancamento: Lancamento | null
    }[]
    total: number
  }[]
  resultado: ResultadoMensal
}
