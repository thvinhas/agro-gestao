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

export interface Venda {
  id: number
  animal_type: 'vaca' | 'bezerro'
  animal_id: number
  valor: number
  arroba: number | null
  data_venda: string
  created_at: string
}

export interface Vaca {
  id: number
  numero: number
  nome: string
  data: string | null
  observacoes: string | null
  ativo: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export interface VacaInput {
  numero: number
  nome: string
  data?: string | null
  observacoes?: string | null
}

export interface Parto {
  id: number
  vaca_id: number
  numero_parto: number | null
  data_parto: string
  sexo_bezerro: string | null
  numero_bezerro: number | null
  data_apartacao: string | null
  status_bezerro: string | null
  virou_vaca_id: number | null
  created_at: string
  updated_at: string
}

export interface PartoInput {
  vaca_id: number
  data_parto: string
  sexo_bezerro?: string | null
  numero_bezerro?: number | null
  data_apartacao?: string | null
}

export interface ProducaoLeite {
  id: number
  vaca_id: number
  quantidade: number
  data: string
  created_at: string
}

export interface ProducaoLeiteInput {
  vaca_id: number
  quantidade: number
}

export interface Cio {
  id: number
  vaca_id: number
  data_cio: string
  observacao: string | null
  created_at: string
  updated_at: string
}

export interface CioInput {
  vaca_id: number
  data_cio: string
  observacao?: string | null
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
