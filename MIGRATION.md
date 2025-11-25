# 🔄 Guia de Migração

## Atualização do Banco de Dados

Se você já tinha o sistema instalado e precisa atualizar para a versão com suporte a áudio, fotos e vídeos:

### Opção 1: Resetar o banco (perde dados existentes)

```bash
npm run prisma:migrate reset
```

### Opção 2: Criar nova migration (preserva dados)

```bash
# Gerar nova migration
npx prisma migrate dev --name add_media_support

# Ou se preferir criar manualmente
npx prisma migrate dev
```

### Opção 3: Aplicar migration manualmente

Se você já tem dados importantes, pode criar a migration manualmente:

1. Execute:
```bash
npx prisma migrate dev --create-only --name add_media_support
```

2. Edite o arquivo de migration gerado em `prisma/migrations/` para adicionar as colunas:
```sql
ALTER TABLE "Message" ADD COLUMN "type" TEXT DEFAULT 'text';
ALTER TABLE "Message" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Message" ADD COLUMN "fileSize" INTEGER;
```

3. Execute:
```bash
npx prisma migrate deploy
```

## Verificar se funcionou

Após a migration, verifique se as colunas foram adicionadas:

```bash
npx prisma studio
```

Você deve ver as novas colunas na tabela `Message`:
- `type` (text, default: 'text')
- `fileUrl` (text, nullable)
- `fileName` (text, nullable)
- `fileSize` (integer, nullable)


