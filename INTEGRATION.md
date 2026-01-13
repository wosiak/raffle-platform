# Integração Supabase - Guia de Migração

## Status da Integração

✅ **Concluído:**
- ✅ Instalação do @supabase/supabase-js
- ✅ Criação das tabelas SQL (migrations)
- ✅ Cliente Supabase com interface compatível
- ✅ Configuração de Row Level Security (RLS)
- ✅ Correção de ordem das tabelas e dependências SQL

🔄 **Próximo Passo:**
- Migrar código para usar Supabase em vez do mock

## Como Usar

### 1. Setup do Supabase

1. Crie um projeto no [Supabase](https://supabase.com) (gratuito)
2. Anote sua URL e chave anon key (Settings > API)
3. Execute os SQL migrations no SQL Editor:
   - `supabase/migrations/001_initial_schema.sql` (primeiro)
   - `supabase/migrations/002_row_level_security.sql` (depois)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Migrar para Supabase

Por enquanto, o sistema usa um cliente mockado por padrão. Para migrar:

**Opção Recomendada: Substituir o mock**
- Edite `src/api/base44Client.ts`
- Substitua o conteúdo pelo export do Supabase:
  ```typescript
  export { base44 } from './supabaseClient';
  ```

### 4. Testar

1. Configure as variáveis de ambiente
2. Execute as migrations no Supabase
3. Inicie o projeto: `npm run dev`
4. Teste criar/atualizar/deletar registros

## Estrutura das Tabelas

Todas as tabelas foram criadas na ordem correta (respeitando dependências):
1. organizations
2. members
3. partners  
4. campaigns
5. draws
6. transactions
7. vouchers
8. campaign_entries
9. testimonials
10. audit_logs
11. raffles

Todas com:
- ✅ UUID como chave primária
- ✅ Timestamps (created_at, updated_at)
- ✅ Índices para performance
- ✅ Foreign keys apropriadas
- ✅ Validações de enum
- ✅ Campos JSONB para dados flexíveis

## Próximos Passos

1. **Migrar código**: Substituir mock por Supabase
2. **Autenticação**: Integrar Supabase Auth
3. **Storage**: Configurar buckets para uploads (opcional)
4. **RLS Refinado**: Ajustar políticas de segurança conforme necessário

## Notas Importantes

- O plano gratuito do Supabase é suficiente para começar
- As políticas RLS estão configuradas mas podem precisar ajustes
- O cliente Supabase mantém a mesma interface do mock para facilitar migração
