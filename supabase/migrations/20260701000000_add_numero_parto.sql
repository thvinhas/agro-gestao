-- Adiciona coluna numero_parto para numeração sequencial de partos por vaca
ALTER TABLE partos ADD COLUMN IF NOT EXISTS numero_parto INTEGER;

-- Backfill: numera partos existentes sequencialmente por vaca (ordenado por data + id)
WITH numbered AS (
  SELECT id, vaca_id,
    ROW_NUMBER() OVER (PARTITION BY vaca_id ORDER BY data_parto, id) AS seq
  FROM partos
  WHERE numero_parto IS NULL
)
UPDATE partos p
SET numero_parto = numbered.seq
FROM numbered
WHERE p.id = numbered.id;
