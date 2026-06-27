create sequence "public"."categorias_id_seq";

create sequence "public"."cios_id_seq";

create sequence "public"."itens_id_seq";

create sequence "public"."partos_id_seq";

create sequence "public"."producao_leite_id_seq";

create sequence "public"."vacas_id_seq";

create sequence "public"."vendas_id_seq";


  create table "public"."categorias" (
    "id" integer not null default nextval('public.categorias_id_seq'::regclass),
    "nome" text not null,
    "tipo" text not null,
    "ordem" integer not null default 0
      );


alter table "public"."categorias" enable row level security;


  create table "public"."cios" (
    "id" integer not null default nextval('public.cios_id_seq'::regclass),
    "vaca_id" integer not null,
    "data_cio" date not null,
    "observacao" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."cios" enable row level security;


  create table "public"."itens" (
    "id" integer not null default nextval('public.itens_id_seq'::regclass),
    "categoria_id" integer,
    "nome" text not null,
    "unidade" text,
    "tem_quantidade" boolean default true,
    "ordem" integer not null default 0,
    "ativo" boolean default true
      );


alter table "public"."itens" enable row level security;


  create table "public"."lancamentos" (
    "id" uuid not null default gen_random_uuid(),
    "item_id" integer,
    "user_id" uuid not null,
    "mes" integer not null,
    "ano" integer not null,
    "quantidade" numeric(12,3),
    "valor_unitario" numeric(12,4),
    "custo_total_manual" numeric(12,2),
    "custo_total" numeric(12,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."lancamentos" enable row level security;


  create table "public"."partos" (
    "id" integer not null default nextval('public.partos_id_seq'::regclass),
    "vaca_id" integer not null,
    "data_parto" date not null,
    "sexo_bezerro" text,
    "numero_bezerro" integer,
    "data_apartacao" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "status_bezerro" text default 'pendente'::text,
    "virou_vaca_id" integer
      );


alter table "public"."partos" enable row level security;


  create table "public"."producao_leite" (
    "id" integer not null default nextval('public.producao_leite_id_seq'::regclass),
    "vaca_id" integer not null,
    "quantidade" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "data" date not null default CURRENT_DATE
      );


alter table "public"."producao_leite" enable row level security;


  create table "public"."vacas" (
    "id" integer not null default nextval('public.vacas_id_seq'::regclass),
    "user_id" uuid not null,
    "numero" integer not null,
    "nome" text not null,
    "data" date,
    "ativo" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "observacoes" text
      );


alter table "public"."vacas" enable row level security;


  create table "public"."vendas" (
    "id" integer not null default nextval('public.vendas_id_seq'::regclass),
    "animal_type" text not null,
    "animal_id" integer not null,
    "valor" numeric not null,
    "arroba" numeric,
    "data_venda" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone default now()
      );


alter sequence "public"."categorias_id_seq" owned by "public"."categorias"."id";

alter sequence "public"."cios_id_seq" owned by "public"."cios"."id";

alter sequence "public"."itens_id_seq" owned by "public"."itens"."id";

alter sequence "public"."partos_id_seq" owned by "public"."partos"."id";

alter sequence "public"."producao_leite_id_seq" owned by "public"."producao_leite"."id";

alter sequence "public"."vacas_id_seq" owned by "public"."vacas"."id";

alter sequence "public"."vendas_id_seq" owned by "public"."vendas"."id";

CREATE UNIQUE INDEX categorias_pkey ON public.categorias USING btree (id);

CREATE UNIQUE INDEX cios_pkey ON public.cios USING btree (id);

CREATE INDEX idx_cios_vaca_id ON public.cios USING btree (vaca_id);

CREATE INDEX idx_itens_categoria_id ON public.itens USING btree (categoria_id);

CREATE INDEX idx_lancamentos_item_id ON public.lancamentos USING btree (item_id);

CREATE INDEX idx_partos_vaca_id ON public.partos USING btree (vaca_id);

CREATE INDEX idx_producao_leite_data ON public.producao_leite USING btree (data);

CREATE INDEX idx_producao_leite_vaca_id ON public.producao_leite USING btree (vaca_id);

CREATE INDEX idx_vendas_data ON public.vendas USING btree (data_venda);

CREATE UNIQUE INDEX itens_pkey ON public.itens USING btree (id);

CREATE UNIQUE INDEX lancamentos_item_id_mes_ano_user_id_key ON public.lancamentos USING btree (item_id, mes, ano, user_id);

CREATE UNIQUE INDEX lancamentos_pkey ON public.lancamentos USING btree (id);

CREATE UNIQUE INDEX partos_pkey ON public.partos USING btree (id);

CREATE UNIQUE INDEX producao_leite_pkey ON public.producao_leite USING btree (id);

CREATE UNIQUE INDEX vacas_numero_user_id_key ON public.vacas USING btree (numero, user_id);

CREATE UNIQUE INDEX vacas_pkey ON public.vacas USING btree (id);

CREATE UNIQUE INDEX vendas_pkey ON public.vendas USING btree (id);

alter table "public"."categorias" add constraint "categorias_pkey" PRIMARY KEY using index "categorias_pkey";

alter table "public"."cios" add constraint "cios_pkey" PRIMARY KEY using index "cios_pkey";

alter table "public"."itens" add constraint "itens_pkey" PRIMARY KEY using index "itens_pkey";

alter table "public"."lancamentos" add constraint "lancamentos_pkey" PRIMARY KEY using index "lancamentos_pkey";

alter table "public"."partos" add constraint "partos_pkey" PRIMARY KEY using index "partos_pkey";

alter table "public"."producao_leite" add constraint "producao_leite_pkey" PRIMARY KEY using index "producao_leite_pkey";

alter table "public"."vacas" add constraint "vacas_pkey" PRIMARY KEY using index "vacas_pkey";

alter table "public"."vendas" add constraint "vendas_pkey" PRIMARY KEY using index "vendas_pkey";

alter table "public"."categorias" add constraint "categorias_tipo_check" CHECK ((tipo = ANY (ARRAY['receita'::text, 'custo_variavel'::text, 'custo_fixo'::text]))) not valid;

alter table "public"."categorias" validate constraint "categorias_tipo_check";

alter table "public"."cios" add constraint "cios_vaca_id_fkey" FOREIGN KEY (vaca_id) REFERENCES public.vacas(id) ON DELETE CASCADE not valid;

alter table "public"."cios" validate constraint "cios_vaca_id_fkey";

alter table "public"."itens" add constraint "itens_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE CASCADE not valid;

alter table "public"."itens" validate constraint "itens_categoria_id_fkey";

alter table "public"."lancamentos" add constraint "lancamentos_ano_check" CHECK (((ano >= 2000) AND (ano <= 2100))) not valid;

alter table "public"."lancamentos" validate constraint "lancamentos_ano_check";

alter table "public"."lancamentos" add constraint "lancamentos_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE CASCADE not valid;

alter table "public"."lancamentos" validate constraint "lancamentos_item_id_fkey";

alter table "public"."lancamentos" add constraint "lancamentos_item_id_mes_ano_user_id_key" UNIQUE using index "lancamentos_item_id_mes_ano_user_id_key";

alter table "public"."lancamentos" add constraint "lancamentos_mes_check" CHECK (((mes >= 1) AND (mes <= 12))) not valid;

alter table "public"."lancamentos" validate constraint "lancamentos_mes_check";

alter table "public"."lancamentos" add constraint "lancamentos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."lancamentos" validate constraint "lancamentos_user_id_fkey";

alter table "public"."partos" add constraint "partos_vaca_id_fkey" FOREIGN KEY (vaca_id) REFERENCES public.vacas(id) ON DELETE CASCADE not valid;

alter table "public"."partos" validate constraint "partos_vaca_id_fkey";

alter table "public"."partos" add constraint "partos_virou_vaca_id_fkey" FOREIGN KEY (virou_vaca_id) REFERENCES public.vacas(id) not valid;

alter table "public"."partos" validate constraint "partos_virou_vaca_id_fkey";

alter table "public"."producao_leite" add constraint "producao_leite_vaca_id_fkey" FOREIGN KEY (vaca_id) REFERENCES public.vacas(id) ON DELETE CASCADE not valid;

alter table "public"."producao_leite" validate constraint "producao_leite_vaca_id_fkey";

alter table "public"."vacas" add constraint "vacas_numero_user_id_key" UNIQUE using index "vacas_numero_user_id_key";

alter table "public"."vacas" add constraint "vacas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."vacas" validate constraint "vacas_user_id_fkey";

alter table "public"."vendas" add constraint "vendas_animal_type_check" CHECK ((animal_type = ANY (ARRAY['vaca'::text, 'bezerro'::text]))) not valid;

alter table "public"."vendas" validate constraint "vendas_animal_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calcular_custo_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.custo_total_manual IS NOT NULL THEN
    NEW.custo_total := NEW.custo_total_manual;
  ELSIF NEW.quantidade IS NOT NULL AND NEW.valor_unitario IS NOT NULL THEN
    NEW.custo_total := ROUND(NEW.quantidade * NEW.valor_unitario, 2);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."resultado_mensal" as  SELECT l.mes,
    l.ano,
    l.user_id,
    c.tipo,
    c.nome AS categoria,
    i.nome AS item,
    i.unidade,
    l.quantidade,
    l.valor_unitario,
    l.custo_total,
    sum(l.custo_total) OVER (PARTITION BY l.mes, l.ano, l.user_id, c.tipo) AS total_categoria,
    sum(
        CASE
            WHEN (c.tipo = 'receita'::text) THEN l.custo_total
            ELSE (0)::numeric
        END) OVER (PARTITION BY l.mes, l.ano, l.user_id) AS receita_total,
    sum(
        CASE
            WHEN (c.tipo = 'custo_variavel'::text) THEN l.custo_total
            ELSE (0)::numeric
        END) OVER (PARTITION BY l.mes, l.ano, l.user_id) AS total_custos_variaveis,
    sum(
        CASE
            WHEN (c.tipo = 'custo_fixo'::text) THEN l.custo_total
            ELSE (0)::numeric
        END) OVER (PARTITION BY l.mes, l.ano, l.user_id) AS total_custos_fixos
   FROM ((public.lancamentos l
     JOIN public.itens i ON ((l.item_id = i.id)))
     JOIN public.categorias c ON ((i.categoria_id = c.id)));


grant delete on table "public"."categorias" to "anon";

grant insert on table "public"."categorias" to "anon";

grant references on table "public"."categorias" to "anon";

grant select on table "public"."categorias" to "anon";

grant trigger on table "public"."categorias" to "anon";

grant truncate on table "public"."categorias" to "anon";

grant update on table "public"."categorias" to "anon";

grant delete on table "public"."categorias" to "authenticated";

grant insert on table "public"."categorias" to "authenticated";

grant references on table "public"."categorias" to "authenticated";

grant select on table "public"."categorias" to "authenticated";

grant trigger on table "public"."categorias" to "authenticated";

grant truncate on table "public"."categorias" to "authenticated";

grant update on table "public"."categorias" to "authenticated";

grant references on table "public"."categorias" to "service_role";

grant trigger on table "public"."categorias" to "service_role";

grant truncate on table "public"."categorias" to "service_role";

grant delete on table "public"."cios" to "anon";

grant insert on table "public"."cios" to "anon";

grant references on table "public"."cios" to "anon";

grant select on table "public"."cios" to "anon";

grant trigger on table "public"."cios" to "anon";

grant truncate on table "public"."cios" to "anon";

grant update on table "public"."cios" to "anon";

grant delete on table "public"."cios" to "authenticated";

grant insert on table "public"."cios" to "authenticated";

grant references on table "public"."cios" to "authenticated";

grant select on table "public"."cios" to "authenticated";

grant trigger on table "public"."cios" to "authenticated";

grant truncate on table "public"."cios" to "authenticated";

grant update on table "public"."cios" to "authenticated";

grant references on table "public"."cios" to "service_role";

grant trigger on table "public"."cios" to "service_role";

grant truncate on table "public"."cios" to "service_role";

grant delete on table "public"."itens" to "anon";

grant insert on table "public"."itens" to "anon";

grant references on table "public"."itens" to "anon";

grant select on table "public"."itens" to "anon";

grant trigger on table "public"."itens" to "anon";

grant truncate on table "public"."itens" to "anon";

grant update on table "public"."itens" to "anon";

grant delete on table "public"."itens" to "authenticated";

grant insert on table "public"."itens" to "authenticated";

grant references on table "public"."itens" to "authenticated";

grant select on table "public"."itens" to "authenticated";

grant trigger on table "public"."itens" to "authenticated";

grant truncate on table "public"."itens" to "authenticated";

grant update on table "public"."itens" to "authenticated";

grant references on table "public"."itens" to "service_role";

grant trigger on table "public"."itens" to "service_role";

grant truncate on table "public"."itens" to "service_role";

grant delete on table "public"."lancamentos" to "anon";

grant insert on table "public"."lancamentos" to "anon";

grant references on table "public"."lancamentos" to "anon";

grant select on table "public"."lancamentos" to "anon";

grant trigger on table "public"."lancamentos" to "anon";

grant truncate on table "public"."lancamentos" to "anon";

grant update on table "public"."lancamentos" to "anon";

grant delete on table "public"."lancamentos" to "authenticated";

grant insert on table "public"."lancamentos" to "authenticated";

grant references on table "public"."lancamentos" to "authenticated";

grant select on table "public"."lancamentos" to "authenticated";

grant trigger on table "public"."lancamentos" to "authenticated";

grant truncate on table "public"."lancamentos" to "authenticated";

grant update on table "public"."lancamentos" to "authenticated";

grant references on table "public"."lancamentos" to "service_role";

grant trigger on table "public"."lancamentos" to "service_role";

grant truncate on table "public"."lancamentos" to "service_role";

grant delete on table "public"."partos" to "anon";

grant insert on table "public"."partos" to "anon";

grant references on table "public"."partos" to "anon";

grant select on table "public"."partos" to "anon";

grant trigger on table "public"."partos" to "anon";

grant truncate on table "public"."partos" to "anon";

grant update on table "public"."partos" to "anon";

grant delete on table "public"."partos" to "authenticated";

grant insert on table "public"."partos" to "authenticated";

grant references on table "public"."partos" to "authenticated";

grant select on table "public"."partos" to "authenticated";

grant trigger on table "public"."partos" to "authenticated";

grant truncate on table "public"."partos" to "authenticated";

grant update on table "public"."partos" to "authenticated";

grant references on table "public"."partos" to "service_role";

grant trigger on table "public"."partos" to "service_role";

grant truncate on table "public"."partos" to "service_role";

grant delete on table "public"."producao_leite" to "anon";

grant insert on table "public"."producao_leite" to "anon";

grant references on table "public"."producao_leite" to "anon";

grant select on table "public"."producao_leite" to "anon";

grant trigger on table "public"."producao_leite" to "anon";

grant truncate on table "public"."producao_leite" to "anon";

grant update on table "public"."producao_leite" to "anon";

grant delete on table "public"."producao_leite" to "authenticated";

grant insert on table "public"."producao_leite" to "authenticated";

grant references on table "public"."producao_leite" to "authenticated";

grant select on table "public"."producao_leite" to "authenticated";

grant trigger on table "public"."producao_leite" to "authenticated";

grant truncate on table "public"."producao_leite" to "authenticated";

grant update on table "public"."producao_leite" to "authenticated";

grant references on table "public"."producao_leite" to "service_role";

grant trigger on table "public"."producao_leite" to "service_role";

grant truncate on table "public"."producao_leite" to "service_role";

grant delete on table "public"."vacas" to "anon";

grant insert on table "public"."vacas" to "anon";

grant references on table "public"."vacas" to "anon";

grant select on table "public"."vacas" to "anon";

grant trigger on table "public"."vacas" to "anon";

grant truncate on table "public"."vacas" to "anon";

grant update on table "public"."vacas" to "anon";

grant delete on table "public"."vacas" to "authenticated";

grant insert on table "public"."vacas" to "authenticated";

grant references on table "public"."vacas" to "authenticated";

grant select on table "public"."vacas" to "authenticated";

grant trigger on table "public"."vacas" to "authenticated";

grant truncate on table "public"."vacas" to "authenticated";

grant update on table "public"."vacas" to "authenticated";

grant references on table "public"."vacas" to "service_role";

grant trigger on table "public"."vacas" to "service_role";

grant truncate on table "public"."vacas" to "service_role";

grant references on table "public"."vendas" to "anon";

grant trigger on table "public"."vendas" to "anon";

grant truncate on table "public"."vendas" to "anon";

grant references on table "public"."vendas" to "authenticated";

grant trigger on table "public"."vendas" to "authenticated";

grant truncate on table "public"."vendas" to "authenticated";

grant references on table "public"."vendas" to "service_role";

grant trigger on table "public"."vendas" to "service_role";

grant truncate on table "public"."vendas" to "service_role";


  create policy "Allow all delete on categorias"
  on "public"."categorias"
  as permissive
  for delete
  to public
using (true);



  create policy "Allow all insert on categorias"
  on "public"."categorias"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow all select on categorias"
  on "public"."categorias"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all update on categorias"
  on "public"."categorias"
  as permissive
  for update
  to public
using (true);



  create policy "Users can delete their own cios"
  on "public"."cios"
  as permissive
  for delete
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can insert their own cios"
  on "public"."cios"
  as permissive
  for insert
  to authenticated
with check ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can update their own cios"
  on "public"."cios"
  as permissive
  for update
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can view their own cios"
  on "public"."cios"
  as permissive
  for select
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Allow all delete on itens"
  on "public"."itens"
  as permissive
  for delete
  to public
using (true);



  create policy "Allow all insert on itens"
  on "public"."itens"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow all select on itens"
  on "public"."itens"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all update on itens"
  on "public"."itens"
  as permissive
  for update
  to public
using (true);



  create policy "Users can delete their own lancamentos"
  on "public"."lancamentos"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own lancamentos"
  on "public"."lancamentos"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own lancamentos"
  on "public"."lancamentos"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own lancamentos"
  on "public"."lancamentos"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can delete their own partos"
  on "public"."partos"
  as permissive
  for delete
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can insert their own partos"
  on "public"."partos"
  as permissive
  for insert
  to authenticated
with check ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can update their own partos"
  on "public"."partos"
  as permissive
  for update
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can view their own partos"
  on "public"."partos"
  as permissive
  for select
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can delete their own producao_leite"
  on "public"."producao_leite"
  as permissive
  for delete
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can insert their own producao_leite"
  on "public"."producao_leite"
  as permissive
  for insert
  to authenticated
with check ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can view their own producao_leite"
  on "public"."producao_leite"
  as permissive
  for select
  to authenticated
using ((vaca_id IN ( SELECT vacas.id
   FROM public.vacas
  WHERE (vacas.user_id = auth.uid()))));



  create policy "Users can delete their own vacas"
  on "public"."vacas"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own vacas"
  on "public"."vacas"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own vacas"
  on "public"."vacas"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own vacas"
  on "public"."vacas"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER trg_custo_total BEFORE INSERT OR UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION public.calcular_custo_total();


