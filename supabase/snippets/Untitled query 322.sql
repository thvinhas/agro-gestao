-- ============================================================
-- SCHEMA: Fazenda Leiteira - Planilha de Custos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tabela de categorias (Receita, Custos Variáveis, Custos Fixos)
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'custo_variavel', 'custo_fixo')),
  ordem INT NOT NULL DEFAULT 0
);

-- Tabela de itens (cada linha da planilha)
CREATE TABLE itens (
  id SERIAL PRIMARY KEY,
  categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  unidade TEXT, -- 'kg', 'Litros', 'Cabeças', NULL para valores diretos
  tem_quantidade BOOLEAN DEFAULT true, -- false = valor lançado direto (ex: medicamentos)
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de lançamentos mensais
CREATE TABLE lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id INT REFERENCES itens(id) ON DELETE CASCADE,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  quantidade NUMERIC(12,3),
  valor_unitario NUMERIC(12,4),
  custo_total NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE 
      WHEN quantidade IS NOT NULL AND valor_unitario IS NOT NULL 
      THEN ROUND(quantidade * valor_unitario, 2)
      ELSE custo_total_manual
    END
  ) STORED,
  custo_total_manual NUMERIC(12,2), -- usado quando não há quantidade × valor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, mes, ano)
);

-- Corrigindo: custo_total como coluna normal com trigger
ALTER TABLE lancamentos DROP COLUMN IF EXISTS custo_total;
ALTER TABLE lancamentos ADD COLUMN custo_total NUMERIC(12,2);

CREATE OR REPLACE FUNCTION calcular_custo_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantidade IS NOT NULL AND NEW.valor_unitario IS NOT NULL THEN
    NEW.custo_total := ROUND(NEW.quantidade * NEW.valor_unitario, 2);
  ELSIF NEW.custo_total_manual IS NOT NULL THEN
    NEW.custo_total := NEW.custo_total_manual;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custo_total
  BEFORE INSERT OR UPDATE ON lancamentos
  FOR EACH ROW EXECUTE FUNCTION calcular_custo_total();

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

INSERT INTO categorias (nome, tipo, ordem) VALUES
  ('Receita', 'receita', 1),
  ('Custos Variáveis', 'custo_variavel', 2),
  ('Custos Fixos', 'custo_fixo', 3);

-- Receitas
INSERT INTO itens (categoria_id, nome, unidade, tem_quantidade, ordem) VALUES
  (1, 'Venda de leite', 'Litros', true, 1),
  (1, 'Venda de animais', 'Cabeças', true, 2),
  (1, 'Outras receitas', NULL, false, 3);

-- Custos Variáveis
INSERT INTO itens (categoria_id, nome, unidade, tem_quantidade, ordem) VALUES
  (2, 'Ração concentrada', 'kg', true, 1),
  (2, 'Silagem', 'kg', true, 2),
  (2, 'Sal mineral', 'kg', true, 3),
  (2, 'Medicamentos', NULL, false, 4),
  (2, 'Vacinas', NULL, false, 5),
  (2, 'Inseminação/Reprodução', NULL, false, 6),
  (2, 'Energia elétrica', NULL, false, 7),
  (2, 'Combustível', NULL, false, 8),
  (2, 'Mão de obra temporária', NULL, false, 9),
  (2, 'Outros custos variáveis', NULL, false, 10);

-- Custos Fixos
INSERT INTO itens (categoria_id, nome, unidade, tem_quantidade, ordem) VALUES
  (3, 'Salários', NULL, false, 1),
  (3, 'Pró-labore', NULL, false, 2),
  (3, 'Depreciação de máquinas', NULL, false, 3),
  (3, 'Depreciação de instalações', NULL, false, 4),
  (3, 'Manutenção de equipamentos', NULL, false, 5),
  (3, 'Impostos e taxas', NULL, false, 6),
  (3, 'Seguro', NULL, false, 7),
  (3, 'Juros de financiamentos', NULL, false, 8);

-- ============================================================
-- VIEW: Resultado mensal consolidado
-- ============================================================

CREATE OR REPLACE VIEW resultado_mensal AS
SELECT
  l.mes,
  l.ano,
  c.tipo,
  c.nome AS categoria,
  i.nome AS item,
  i.unidade,
  l.quantidade,
  l.valor_unitario,
  l.custo_total,
  SUM(l.custo_total) OVER (PARTITION BY l.mes, l.ano, c.tipo) AS total_categoria,
  SUM(CASE WHEN c.tipo = 'receita' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano) AS receita_total,
  SUM(CASE WHEN c.tipo = 'custo_variavel' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano) AS total_custos_variaveis,
  SUM(CASE WHEN c.tipo = 'custo_fixo' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano) AS total_custos_fixos
FROM lancamentos l
JOIN itens i ON l.item_id = i.id
JOIN categorias c ON i.categoria_id = c.id;

-- RLS (Row Level Security) - habilite conforme sua necessidade de autenticação
-- ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE itens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
