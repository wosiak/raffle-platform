# Setup do Supabase

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (gratuita)
3. Crie um novo projeto
4. Anote a URL do projeto e a chave anon key

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

## 3. Executar Migrations

1. Acesse o SQL Editor no painel do Supabase
2. Execute o arquivo `supabase/migrations/001_initial_schema.sql`
3. Execute o arquivo `supabase/migrations/002_row_level_security.sql`

Ou use a CLI do Supabase (opcional):

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

## 4. Configurar Autenticação (Opcional - para produção)

1. Vá em Authentication > Providers
2. Configure os provedores desejados (Email, Google, etc.)
3. Configure as URLs de redirect

## 5. Configurar Storage (Opcional - para uploads)

1. Vá em Storage
2. Crie buckets para: logos, covers, avatars, photos
3. Configure políticas de acesso

## Notas

- O plano gratuito do Supabase tem limites, mas é suficiente para começar
- As políticas RLS podem ser refinadas conforme necessário
- Para produção, considere ajustar as políticas de segurança
