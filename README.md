# Sistema de Chat - Marcus Cabelo

Sistema de bate-papo completo com tema WhatsApp para atendimento online, sem necessidade de abrir o WhatsApp.

## 🚀 Funcionalidades

- ✅ Interface idêntica ao WhatsApp (mobile-first)
- ✅ Modal de entrada para leads (nome e número do WhatsApp)
- ✅ Painel de atendentes com lista de conversas
- ✅ Chat em tempo real com WebSocket
- ✅ **Envio de mensagens de texto**
- ✅ **Envio de áudio (gravação direta)**
- ✅ **Envio de fotos e vídeos**
- ✅ Mensagens aparecem instantaneamente (otimisticamente)
- ✅ Notificações quando há clientes aguardando
- ✅ Sistema de status (aguardando, em atendimento, finalizada)
- ✅ Indicador de digitação
- ✅ Design responsivo e moderno

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Criar o banco de dados e aplicar migrations
npm run prisma:migrate

# Se já tiver um banco existente, pode precisar resetar:
# npm run prisma:migrate reset
```

4. Configure as variáveis de ambiente:
```bash
# Copie o arquivo .env.example para .env
cp .env.example .env
```

Edite o arquivo `.env` e configure:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-aqui"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

## 🎯 Como Usar

### Desenvolvimento

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse:
   - **Para Leads/Clientes**: `http://localhost:3000`
   - **Para Atendentes**: `http://localhost:3000/attendant`

### Produção

1. Faça o build:
```bash
npm run build
```

2. Inicie o servidor:
```bash
npm start
```

## 📱 Fluxo de Uso

### Para o Lead/Cliente:
1. Acessa o link público
2. Preenche nome e número do WhatsApp no modal
3. Clica em "Começar Conversa"
4. Inicia o chat (status: aguardando)

### Para o Atendente:
1. Acessa `/attendant`
2. Vê a lista de conversas aguardando
3. Clica em uma conversa para iniciar atendimento
4. A conversa muda para "em atendimento"
5. Pode trocar mensagens em tempo real

## 🗂️ Estrutura do Projeto

```
├── app/
│   ├── api/              # API Routes
│   ├── attendant/        # Página do atendente
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial (para leads)
├── components/
│   ├── AttendantPanel.tsx    # Painel do atendente
│   ├── ChatInterface.tsx     # Interface do chat
│   ├── ConversationList.tsx  # Lista de conversas
│   └── WelcomeModal.tsx      # Modal de entrada
├── lib/
│   ├── prisma.ts         # Cliente Prisma
│   └── socket.ts         # Configuração WebSocket
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
└── server.ts             # Servidor customizado com WebSocket
```

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Socket.IO** - WebSocket para chat em tempo real
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados (pode ser trocado por PostgreSQL/MySQL)

## 📝 Notas

- O sistema usa SQLite por padrão (arquivo `dev.db`)
- Para produção, recomenda-se usar PostgreSQL ou MySQL
- O sistema de autenticação de atendentes está simplificado (pode ser expandido)
- As mensagens são salvas no banco de dados
- O WebSocket mantém conexão em tempo real
- Arquivos enviados são salvos em `public/uploads/` (criar manualmente se necessário)
- **IMPORTANTE**: Após atualizar o schema do Prisma, execute `npm run prisma:migrate` para aplicar as mudanças

## 🔒 Segurança

⚠️ **Importante para produção:**
- Altere o `JWT_SECRET` no `.env`
- Configure CORS adequadamente
- Implemente autenticação real para atendentes
- Use HTTPS em produção
- Configure rate limiting

## 📄 Licença

Este projeto é de uso privado.

