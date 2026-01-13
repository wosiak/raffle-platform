# Configuração do Supabase

## Por que não há logs no F12/Network?

O código está usando um **mock local** (armazenamento em memória) em vez do Supabase. Por isso:
- ❌ Não aparecem requisições HTTP no Network/F12
- ❌ Os dados não são salvos no Supabase
- ❌ Os dados são perdidos ao recarregar a página

## Como Configurar o Supabase

### 1. Criar arquivo `.env`

Crie um arquivo `.env` na **raiz do projeto** (mesmo nível do `package.json`):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

**Onde encontrar essas informações:**
1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Reiniciar o servidor de desenvolvimento

⚠️ **IMPORTANTE**: Após criar/modificar o `.env`, você **DEVE reiniciar** o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois reiniciar:
npm run dev
```

O Vite só lê as variáveis de ambiente na inicialização!

### 3. Verificar se está funcionando

Após configurar e reiniciar:

1. Abra o **F12** (DevTools) → aba **Network**
2. Faça uma ação (criar sorteio, etc.)
3. Você deve ver requisições para `supabase.co` na aba Network
4. Os dados devem aparecer no Supabase Dashboard → Table Editor

### 4. Estrutura do .env

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Observações:**
- ⚠️ **NUNCA** commite o arquivo `.env` no Git (ele deve estar no `.gitignore`)
- ✅ Use `.env.example` como referência
- 🔒 A chave `anon` é segura para usar no frontend (é pública)

## Troubleshooting

### "Supabase não está configurado" no console

**Causa**: As variáveis de ambiente não foram lidas.

**Solução:**
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Verifique se os nomes das variáveis estão corretos (`VITE_` no início)
3. **Reinicie o servidor** (npm run dev)

### Ainda não aparece nada no Network

**Causa**: O código ainda está usando o mock.

**Solução:**
1. Verifique se o `.env` está configurado corretamente
2. Verifique o console do navegador para erros
3. Reinicie o servidor de desenvolvimento

### Erro 401 (Unauthorized)

**Causa**: A chave anon está incorreta ou as políticas RLS estão bloqueando.

**Solução:**
1. Verifique se copiou a chave completa (é muito longa)
2. Execute o arquivo `002_row_level_security.sql` no Supabase

## Próximos Passos

Após configurar:
1. ✅ Os dados serão salvos no Supabase
2. ✅ Você verá requisições HTTP no Network
3. ✅ Os dados persistem após recarregar
4. ✅ Você pode ver os dados no Supabase Dashboard
