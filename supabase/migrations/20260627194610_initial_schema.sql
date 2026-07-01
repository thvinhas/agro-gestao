-- This migration is safe to run on both a fresh database and one that already has categorias/itens/lancamentos

-- categorias
create sequence if not exists "public"."categorias_id_seq";
create table if not exists "public"."categorias" (
    "id" integer not null default nextval('public.categorias_id_seq'::regclass),
    "nome" text not null,
    "tipo" text not null,
    "ordem" integer not null default 0
);
alter sequence "public"."categorias_id_seq" owned by "public"."categorias"."id";

-- itens
create sequence if not exists "public"."itens_id_seq";
create table if not exists "public"."itens" (
    "id" integer not null default nextval('public.itens_id_seq'::regclass),
    "categoria_id" integer,
    "nome" text not null,
    "unidade" text,
    "tem_quantidade" boolean default true,
    "ordem" integer not null default 0,
    "ativo" boolean default true
);
alter sequence "public"."itens_id_seq" owned by "public"."itens"."id";

-- lancamentos
create table if not exists "public"."lancamentos" (
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

-- pecuaria sequences
create sequence if not exists "public"."vacas_id_seq";
create sequence if not exists "public"."partos_id_seq";
create sequence if not exists "public"."producao_leite_id_seq";
create sequence if not exists "public"."cios_id_seq";
create sequence if not exists "public"."vendas_id_seq";

-- vacas
create table if not exists "public"."vacas" (
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
alter sequence "public"."vacas_id_seq" owned by "public"."vacas"."id";

-- partos
create table if not exists "public"."partos" (
    "id" integer not null default nextval('public.partos_id_seq'::regclass),
    "vaca_id" integer not null,
    "data_parto" date not null,
    "numero_parto" integer,
    "sexo_bezerro" text,
    "numero_bezerro" integer,
    "data_apartacao" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "status_bezerro" text default 'pendente'::text,
    "virou_vaca_id" integer
);
alter sequence "public"."partos_id_seq" owned by "public"."partos"."id";

-- producao_leite
create table if not exists "public"."producao_leite" (
    "id" integer not null default nextval('public.producao_leite_id_seq'::regclass),
    "vaca_id" integer not null,
    "quantidade" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "data" date not null default CURRENT_DATE
);
alter sequence "public"."producao_leite_id_seq" owned by "public"."producao_leite"."id";

-- cios
create table if not exists "public"."cios" (
    "id" integer not null default nextval('public.cios_id_seq'::regclass),
    "vaca_id" integer not null,
    "data_cio" date not null,
    "observacao" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
alter sequence "public"."cios_id_seq" owned by "public"."cios"."id";

-- vendas
create table if not exists "public"."vendas" (
    "id" integer not null default nextval('public.vendas_id_seq'::regclass),
    "animal_type" text not null,
    "animal_id" integer not null,
    "valor" numeric not null,
    "arroba" numeric,
    "data_venda" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone default now()
);
alter sequence "public"."vendas_id_seq" owned by "public"."vendas"."id";

----------------------- indexes -----------------------

create unique index if not exists categorias_pkey on "public"."categorias" using btree (id);
create unique index if not exists itens_pkey on "public"."itens" using btree (id);
create unique index if not exists lancamentos_pkey on "public"."lancamentos" using btree (id);
create unique index if not exists vacas_pkey on "public"."vacas" using btree (id);
create unique index if not exists partos_pkey on "public"."partos" using btree (id);
create unique index if not exists producao_leite_pkey on "public"."producao_leite" using btree (id);
create unique index if not exists cios_pkey on "public"."cios" using btree (id);
create unique index if not exists vendas_pkey on "public"."vendas" using btree (id);

create unique index if not exists vacas_numero_user_id_key on "public"."vacas" using btree (numero, user_id);
create unique index if not exists lancamentos_item_id_mes_ano_user_id_key on "public"."lancamentos" using btree (item_id, mes, ano, user_id);

create index if not exists idx_partos_vaca_id on "public"."partos" using btree (vaca_id);
create index if not exists idx_producao_leite_vaca_id on "public"."producao_leite" using btree (vaca_id);
create index if not exists idx_producao_leite_data on "public"."producao_leite" using btree (data);
create index if not exists idx_cios_vaca_id on "public"."cios" using btree (vaca_id);
create index if not exists idx_itens_categoria_id on "public"."itens" using btree (categoria_id);
create index if not exists idx_lancamentos_item_id on "public"."lancamentos" using btree (item_id);
create index if not exists idx_vendas_data on "public"."vendas" using btree (data_venda);

----------------------- primary keys -----------------------

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'categorias_pkey') then
    alter table "public"."categorias" add constraint "categorias_pkey" primary key using index "categorias_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'itens_pkey') then
    alter table "public"."itens" add constraint "itens_pkey" primary key using index "itens_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_pkey') then
    alter table "public"."lancamentos" add constraint "lancamentos_pkey" primary key using index "lancamentos_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vacas_pkey') then
    alter table "public"."vacas" add constraint "vacas_pkey" primary key using index "vacas_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'partos_pkey') then
    alter table "public"."partos" add constraint "partos_pkey" primary key using index "partos_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'producao_leite_pkey') then
    alter table "public"."producao_leite" add constraint "producao_leite_pkey" primary key using index "producao_leite_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cios_pkey') then
    alter table "public"."cios" add constraint "cios_pkey" primary key using index "cios_pkey";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vendas_pkey') then
    alter table "public"."vendas" add constraint "vendas_pkey" primary key using index "vendas_pkey";
  end if;
end $$;

----------------------- constraints -----------------------

do $$ begin
  -- check constraints
  if not exists (select 1 from pg_constraint where conname = 'categorias_tipo_check') then
    alter table "public"."categorias" add constraint "categorias_tipo_check" check (tipo = any (array['receita'::text, 'custo_variavel'::text, 'custo_fixo'::text]));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_mes_check') then
    alter table "public"."lancamentos" add constraint "lancamentos_mes_check" check (mes >= 1 and mes <= 12);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_ano_check') then
    alter table "public"."lancamentos" add constraint "lancamentos_ano_check" check (ano >= 2000 and ano <= 2100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vendas_animal_type_check') then
    alter table "public"."vendas" add constraint "vendas_animal_type_check" check (animal_type = any (array['vaca'::text, 'bezerro'::text]));
  end if;

  -- foreign keys
  if not exists (select 1 from pg_constraint where conname = 'itens_categoria_id_fkey') then
    alter table "public"."itens" add constraint "itens_categoria_id_fkey" foreign key (categoria_id) references "public"."categorias"(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_item_id_fkey') then
    alter table "public"."lancamentos" add constraint "lancamentos_item_id_fkey" foreign key (item_id) references "public"."itens"(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_user_id_fkey') then
    alter table "public"."lancamentos" add constraint "lancamentos_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vacas_user_id_fkey') then
    alter table "public"."vacas" add constraint "vacas_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'partos_vaca_id_fkey') then
    alter table "public"."partos" add constraint "partos_vaca_id_fkey" foreign key (vaca_id) references "public"."vacas"(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'partos_virou_vaca_id_fkey') then
    alter table "public"."partos" add constraint "partos_virou_vaca_id_fkey" foreign key (virou_vaca_id) references "public"."vacas"(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'producao_leite_vaca_id_fkey') then
    alter table "public"."producao_leite" add constraint "producao_leite_vaca_id_fkey" foreign key (vaca_id) references "public"."vacas"(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cios_vaca_id_fkey') then
    alter table "public"."cios" add constraint "cios_vaca_id_fkey" foreign key (vaca_id) references "public"."vacas"(id) on delete cascade;
  end if;

  -- unique constraints
  if not exists (select 1 from pg_constraint where conname = 'lancamentos_item_id_mes_ano_user_id_key') then
    alter table "public"."lancamentos" add constraint "lancamentos_item_id_mes_ano_user_id_key" unique using index "lancamentos_item_id_mes_ano_user_id_key";
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vacas_numero_user_id_key') then
    alter table "public"."vacas" add constraint "vacas_numero_user_id_key" unique using index "vacas_numero_user_id_key";
  end if;
end $$;

----------------------- RLS -----------------------

alter table "public"."categorias" enable row level security;
alter table "public"."itens" enable row level security;
alter table "public"."lancamentos" enable row level security;
alter table "public"."vacas" enable row level security;
alter table "public"."partos" enable row level security;
alter table "public"."producao_leite" enable row level security;
alter table "public"."cios" enable row level security;
alter table "public"."vendas" enable row level security;

----------------------- grants -----------------------

grant delete, insert, references, select, trigger, truncate, update on "public"."categorias" to "anon", "authenticated";
grant references, trigger, truncate on "public"."categorias" to "service_role";
grant delete, insert, references, select, trigger, truncate, update on "public"."itens" to "anon", "authenticated";
grant references, trigger, truncate on "public"."itens" to "service_role";

grant delete, insert, references, select, trigger, truncate, update on "public"."lancamentos" to "anon";
grant delete, insert, references, select, trigger, truncate, update on "public"."lancamentos" to "authenticated";
grant references, trigger, truncate on "public"."lancamentos" to "service_role";

grant delete, insert, references, select, trigger, truncate, update on "public"."vacas" to "anon";
grant delete, insert, references, select, trigger, truncate, update on "public"."vacas" to "authenticated";
grant references, trigger, truncate on "public"."vacas" to "service_role";

grant delete, insert, references, select, trigger, truncate, update on "public"."partos" to "anon";
grant delete, insert, references, select, trigger, truncate, update on "public"."partos" to "authenticated";
grant references, trigger, truncate on "public"."partos" to "service_role";

grant delete, insert, references, select, trigger, truncate, update on "public"."producao_leite" to "anon";
grant delete, insert, references, select, trigger, truncate, update on "public"."producao_leite" to "authenticated";
grant references, trigger, truncate on "public"."producao_leite" to "service_role";

grant delete, insert, references, select, trigger, truncate, update on "public"."cios" to "anon";
grant delete, insert, references, select, trigger, truncate, update on "public"."cios" to "authenticated";
grant references, trigger, truncate on "public"."cios" to "service_role";

grant insert, references, select, trigger, truncate on "public"."vendas" to "anon";
grant insert, references, select, trigger, truncate on "public"."vendas" to "authenticated";
grant references, trigger, truncate on "public"."vendas" to "service_role";

----------------------- RLS policies -----------------------

do $$ begin
  drop policy if exists "Allow all select on categorias" on "public"."categorias";
  create policy "Allow all select on categorias" on "public"."categorias" as permissive for select to public using (true);
  drop policy if exists "Allow all insert on categorias" on "public"."categorias";
  create policy "Allow all insert on categorias" on "public"."categorias" as permissive for insert to public with check (true);
  drop policy if exists "Allow all update on categorias" on "public"."categorias";
  create policy "Allow all update on categorias" on "public"."categorias" as permissive for update to public using (true);
  drop policy if exists "Allow all delete on categorias" on "public"."categorias";
  create policy "Allow all delete on categorias" on "public"."categorias" as permissive for delete to public using (true);

  drop policy if exists "Allow all select on itens" on "public"."itens";
  create policy "Allow all select on itens" on "public"."itens" as permissive for select to public using (true);
  drop policy if exists "Allow all insert on itens" on "public"."itens";
  create policy "Allow all insert on itens" on "public"."itens" as permissive for insert to public with check (true);
  drop policy if exists "Allow all update on itens" on "public"."itens";
  create policy "Allow all update on itens" on "public"."itens" as permissive for update to public using (true);
  drop policy if exists "Allow all delete on itens" on "public"."itens";
  create policy "Allow all delete on itens" on "public"."itens" as permissive for delete to public using (true);

  drop policy if exists "Users can view their own lancamentos" on "public"."lancamentos";
  create policy "Users can view their own lancamentos" on "public"."lancamentos" as permissive
    for select to authenticated using (auth.uid() = user_id);
  drop policy if exists "Users can insert their own lancamentos" on "public"."lancamentos";
  create policy "Users can insert their own lancamentos" on "public"."lancamentos" as permissive
    for insert to authenticated with check (auth.uid() = user_id);
  drop policy if exists "Users can update their own lancamentos" on "public"."lancamentos";
  create policy "Users can update their own lancamentos" on "public"."lancamentos" as permissive
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  drop policy if exists "Users can delete their own lancamentos" on "public"."lancamentos";
  create policy "Users can delete their own lancamentos" on "public"."lancamentos" as permissive
    for delete to authenticated using (auth.uid() = user_id);

  drop policy if exists "Users can view their own vacas" on "public"."vacas";
  create policy "Users can view their own vacas" on "public"."vacas" as permissive
    for select to authenticated using (auth.uid() = user_id);
  drop policy if exists "Users can insert their own vacas" on "public"."vacas";
  create policy "Users can insert their own vacas" on "public"."vacas" as permissive
    for insert to authenticated with check (auth.uid() = user_id);
  drop policy if exists "Users can update their own vacas" on "public"."vacas";
  create policy "Users can update their own vacas" on "public"."vacas" as permissive
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  drop policy if exists "Users can delete their own vacas" on "public"."vacas";
  create policy "Users can delete their own vacas" on "public"."vacas" as permissive
    for delete to authenticated using (auth.uid() = user_id);

  drop policy if exists "Users can view their own partos" on "public"."partos";
  create policy "Users can view their own partos" on "public"."partos" as permissive
    for select to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can insert their own partos" on "public"."partos";
  create policy "Users can insert their own partos" on "public"."partos" as permissive
    for insert to authenticated with check (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can update their own partos" on "public"."partos";
  create policy "Users can update their own partos" on "public"."partos" as permissive
    for update to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can delete their own partos" on "public"."partos";
  create policy "Users can delete their own partos" on "public"."partos" as permissive
    for delete to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));

  drop policy if exists "Users can view their own producao_leite" on "public"."producao_leite";
  create policy "Users can view their own producao_leite" on "public"."producao_leite" as permissive
    for select to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can insert their own producao_leite" on "public"."producao_leite";
  create policy "Users can insert their own producao_leite" on "public"."producao_leite" as permissive
    for insert to authenticated with check (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can delete their own producao_leite" on "public"."producao_leite";
  create policy "Users can delete their own producao_leite" on "public"."producao_leite" as permissive
    for delete to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));

  drop policy if exists "Users can view their own cios" on "public"."cios";
  create policy "Users can view their own cios" on "public"."cios" as permissive
    for select to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can insert their own cios" on "public"."cios";
  create policy "Users can insert their own cios" on "public"."cios" as permissive
    for insert to authenticated with check (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can update their own cios" on "public"."cios";
  create policy "Users can update their own cios" on "public"."cios" as permissive
    for update to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
  drop policy if exists "Users can delete their own cios" on "public"."cios";
  create policy "Users can delete their own cios" on "public"."cios" as permissive
    for delete to authenticated using (vaca_id in (select id from public.vacas where user_id = auth.uid()));
end $$;

----------------------- trigger -----------------------

create or replace function public.calcular_custo_total()
returns trigger
language plpgsql
as $function$
begin
  if new.custo_total_manual is not null then
    new.custo_total := new.custo_total_manual;
  elsif new.quantidade is not null and new.valor_unitario is not null then
    new.custo_total := round(new.quantidade * new.valor_unitario, 2);
  end if;
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists trg_custo_total on public.lancamentos;
create trigger trg_custo_total before insert or update on public.lancamentos
  for each row execute function public.calcular_custo_total();

----------------------- view -----------------------

create or replace view "public"."resultado_mensal" as
  select
    l.mes,
    l.ano,
    l.user_id,
    c.tipo,
    c.nome as categoria,
    i.nome as item,
    i.unidade,
    l.quantidade,
    l.valor_unitario,
    l.custo_total,
    sum(l.custo_total) over (partition by l.mes, l.ano, l.user_id, c.tipo) as total_categoria,
    sum(case when c.tipo = 'receita' then l.custo_total else 0 end) over (partition by l.mes, l.ano, l.user_id) as receita_total,
    sum(case when c.tipo = 'custo_variavel' then l.custo_total else 0 end) over (partition by l.mes, l.ano, l.user_id) as total_custos_variaveis,
    sum(case when c.tipo = 'custo_fixo' then l.custo_total else 0 end) over (partition by l.mes, l.ano, l.user_id) as total_custos_fixos
  from lancamentos l
  join itens i on l.item_id = i.id
  join categorias c on i.categoria_id = c.id;
