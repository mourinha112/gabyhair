# 🚀 Instalação Rápida

## Passo a Passo

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar banco de dados
npm run prisma:migrate
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-aqui"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 4. Iniciar o Servidor
```bash
npm run dev
```

### 5. Acessar
- **Clientes/Leads**: http://localhost:3000
- **Atendentes**: http://localhost:3000/attendant

## ✅ Pronto!

O sistema está funcionando. Teste criando uma conversa como cliente e depois acessando como atendente.

## 🔧 Comandos Úteis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Faz build para produção
- `npm run prisma:studio` - Abre interface visual do banco de dados
- `npm run prisma:migrate` - Aplica migrations do banco

## 📝 Notas

- O banco de dados SQLite será criado automaticamente como `dev.db`
- Para produção, considere usar PostgreSQL ou MySQL
- O sistema não tem autenticação de atendentes ainda (pode ser adicionada)


