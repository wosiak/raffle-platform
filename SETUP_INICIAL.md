# Setup Inicial - Primeiro Uso

## Problema: "invalid input syntax for type uuid: 'default'"

Este erro acontece porque o código está tentando usar `organization_id: 'default'` (string) quando deveria usar um UUID válido.

## Solução: Criar uma Organização

O sistema precisa de pelo menos **uma organização** no banco de dados para funcionar.

### Opção 1: Criar via SQL (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute este SQL:

```sql
INSERT INTO organizations (name, slug, type, status)
VALUES ('Minha Organização', 'minha-organizacao', 'winners_club', 'active')
RETURNING id, name, slug;
```

4. Anote o `id` retornado (você não precisará dele, mas é útil para verificar)

### Opção 2: Criar via Interface (se tiver)

Se a interface de criação de organizações estiver funcionando, crie uma organização por lá.

## Após Criar a Organização

1. **Recarregue a página** do aplicativo
2. O código irá carregar automaticamente a primeira organização
3. Agora os sorteios funcionarão corretamente!

## Verificar se Funcionou

1. Tente criar um sorteio novamente
2. Deve funcionar sem erros
3. Os dados devem aparecer no Supabase Dashboard → Table Editor → `draws`

## Nota

O código foi corrigido para:
- ✅ Carregar a primeira organização disponível
- ✅ Usar o UUID da organização (não mais 'default')
- ✅ Mostrar erro se não houver organização

Mas você precisa criar pelo menos uma organização primeiro!
