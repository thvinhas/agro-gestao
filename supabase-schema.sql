-- ============================================================
-- SCHEMA: Fazenda Leiteira - Planilha de Custos
-- Execute no SQL Editor do Supabase (uma vez apenas)
-- ============================================================

-- ============================================================
-- 1. TABELAS
-- ============================================================

-- Tabela de categorias (Receita, Custos Variáveis, Custos Fixos)
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'custo_variavel', 'custo_fixo')),
  ordem INT NOT NULL DEFAULT 0
);

-- Tabela de itens (cada linha da planilha)
CREATE TABLE IF NOT EXISTS itens (
  id SERIAL PRIMARY KEY,
  categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  unidade TEXT,
  tem_quantidade BOOLEAN DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de lançamentos mensais (com user_id para multi-usuário)
CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id INT REFERENCES itens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  quantidade NUMERIC(12,3),
  valor_unitario NUMERIC(12,4),
  custo_total_manual NUMERIC(12,2),
  custo_total NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, mes, ano, user_id)
);

-- ============================================================
-- 1.5 MIGRAÇÃO: adiciona user_id se a tabela já existia sem ele
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lancamentos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE lancamentos ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE lancamentos DROP CONSTRAINT IF EXISTS lancamentos_item_id_mes_ano_key;
    ALTER TABLE lancamentos DROP CONSTRAINT IF EXISTS lancamentos_unique;
    ALTER TABLE lancamentos ADD CONSTRAINT lancamentos_unique UNIQUE(item_id, mes, ano, user_id);
  END IF;
END $$;

-- ============================================================
-- 2. TRIGGER: calcular custo_total automaticamente
-- ============================================================

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

DROP TRIGGER IF EXISTS trg_custo_total ON lancamentos;
CREATE TRIGGER trg_custo_total
  BEFORE INSERT OR UPDATE ON lancamentos
  FOR EACH ROW EXECUTE FUNCTION calcular_custo_total();

-- ============================================================
-- 3. DADOS INICIAIS (ignora se já existirem)
-- ============================================================

INSERT INTO categorias (nome, tipo, ordem)
SELECT * FROM (VALUES
  ('Receita', 'receita', 1),
  ('Custos Variáveis', 'custo_variavel', 2),
  ('Custos Fixos', 'custo_fixo', 3)
) AS data(nome, tipo, ordem)
WHERE NOT EXISTS (SELECT 1 FROM categorias);

INSERT INTO itens (categoria_id, nome, unidade, tem_quantidade, ordem)
SELECT * FROM (VALUES
  (1, 'Venda de leite', 'Litros', true, 1),
  (1, 'Venda de animais', 'Cabeças', true, 2),
  (1, 'Outras receitas', NULL, false, 3),
  (2, 'Ração concentrada', 'kg', true, 1),
  (2, 'Silagem', 'kg', true, 2),
  (2, 'Sal mineral', 'kg', true, 3),
  (2, 'Medicamentos', NULL, false, 4),
  (2, 'Vacinas', NULL, false, 5),
  (2, 'Inseminação/Reprodução', NULL, false, 6),
  (2, 'Energia elétrica', NULL, false, 7),
  (2, 'Combustível', NULL, false, 8),
  (2, 'Mão de obra temporária', NULL, false, 9),
  (2, 'Outros custos variáveis', NULL, false, 10),
  (3, 'Salários', NULL, false, 1),
  (3, 'Pró-labore', NULL, false, 2),
  (3, 'Depreciação de máquinas', NULL, false, 3),
  (3, 'Depreciação de instalações', NULL, false, 4),
  (3, 'Manutenção de equipamentos', NULL, false, 5),
  (3, 'Impostos e taxas', NULL, false, 6),
  (3, 'Seguro', NULL, false, 7),
  (3, 'Juros de financiamentos', NULL, false, 8)
) AS data(categoria_id, nome, unidade, tem_quantidade, ordem)
WHERE NOT EXISTS (SELECT 1 FROM itens);

-- ============================================================
-- 4. VIEW: Resultado mensal consolidado
-- ============================================================

CREATE OR REPLACE VIEW resultado_mensal AS
SELECT
  l.mes,
  l.ano,
  l.user_id,
  c.tipo,
  c.nome AS categoria,
  i.nome AS item,
  i.unidade,
  l.quantidade,
  l.valor_unitario,
  l.custo_total,
  SUM(l.custo_total) OVER (PARTITION BY l.mes, l.ano, l.user_id, c.tipo) AS total_categoria,
  SUM(CASE WHEN c.tipo = 'receita' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano, l.user_id) AS receita_total,
  SUM(CASE WHEN c.tipo = 'custo_variavel' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano, l.user_id) AS total_custos_variaveis,
  SUM(CASE WHEN c.tipo = 'custo_fixo' THEN l.custo_total ELSE 0 END) 
    OVER (PARTITION BY l.mes, l.ano, l.user_id) AS total_custos_fixos
FROM lancamentos l
JOIN itens i ON l.item_id = i.id
JOIN categorias c ON i.categoria_id = c.id;

-- ============================================================
-- 5. PERMISSÕES (roles anon e authenticated)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Desabilita RLS em tabelas de referência (compartilhadas entre usuários)
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens DISABLE ROW LEVEL SECURITY;

-- Habilita RLS apenas em lancamentos (dados por usuário)
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (para executar múltiplas vezes)
DROP POLICY IF EXISTS permit_all_anon ON lancamentos;
DROP POLICY IF EXISTS "Users can view their own lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "Users can insert their own lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "Users can update their own lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "Users can delete their own lancamentos" ON lancamentos;

-- Políticas: cada usuário vê ONLY seus próprios lançamentos
CREATE POLICY "Users can view their own lancamentos" ON lancamentos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lancamentos" ON lancamentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lancamentos" ON lancamentos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lancamentos" ON lancamentos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
