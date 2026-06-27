CREATE OR REPLACE FUNCTION calcular_custo_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.custo_total_manual IS NOT NULL THEN
    NEW.custo_total := NEW.custo_total_manual;
  ELSIF NEW.quantidade IS NOT NULL AND NEW.valor_unitario IS NOT NULL THEN
    NEW.custo_total := ROUND(NEW.quantidade * NEW.valor_unitario, 2);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$func$;
