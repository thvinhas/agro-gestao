# 🐄 Gestão Leiteira

Sistema de gestão financeira para fazenda leiteira com planilha de custos, receitas e resultado operacional.
**Stack:** Next.js 14 · TypeScript · Supabase · Vercel

---

## 🚀 Deploy em 5 passos

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute todo o conteúdo de `supabase-schema.sql`
3. Copie suas credenciais em **Settings > API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Clonar e rodar localmente

```bash
git clone <seu-repo>
cd fazenda-leiteira

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 3. Publicar no GitHub

```bash
git init
git add .
git commit -m "feat: sistema gestão leiteira"
git remote add origin https://github.com/SEU_USUARIO/fazenda-leiteira.git
git push -u origin main
```

### 4. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon
4. Clique em **Deploy** ✅

### 5. Pronto!

O Vercel vai gerar uma URL como `https://fazenda-leiteira.vercel.app`

---

## 📊 Funcionalidades

| Tela           | O que faz                                     |
| -------------- | --------------------------------------------- |
| `/lancamentos` | Planilha mensal completa com entrada de dados |
| `/dashboard`   | Gráficos de evolução dos últimos 12 meses     |

### Na planilha de lançamentos:

- Selecione mês e ano
- Preencha os campos e clique **Salvar** (ou pressione Enter)
- Itens com unidade (kg, Litros): preencha Quantidade + Valor Unitário
- Itens sem unidade (Medicamentos, etc): preencha direto o Custo Total
- KPIs atualizados automaticamente após cada salvamento

---

## 🗃️ Estrutura do banco (Supabase)

```
categorias      → Receita | Custos Variáveis | Custos Fixos
itens           → Cada linha da planilha
lancamentos     → Valores por mês/ano (upsert automático)
resultado_mensal → View que calcula totais e lucro
```

---

## 🔧 Adicionar novos itens

No Supabase SQL Editor:

```sql
-- Exemplo: adicionar "Frete" nos custos variáveis
INSERT INTO itens (categoria_id, nome, unidade, tem_quantidade, ordem)
VALUES (2, 'Frete', NULL, false, 11);
```

---

## 📁 Estrutura do projeto

```
fazenda-leiteira/
├── app/
│   ├── layout.tsx          # Layout global com nav
│   ├── globals.css         # Estilos globais
│   ├── page.tsx            # Redireciona para /lancamentos
│   ├── lancamentos/
│   │   └── page.tsx        # Planilha de entrada de dados
│   └── dashboard/
│       └── page.tsx        # Gráficos e KPIs
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   └── data.ts             # Funções de acesso a dados
├── types/
│   └── index.ts            # Tipos TypeScript
├── supabase-schema.sql     # Schema completo do banco
└── .env.example            # Template de variáveis
```
