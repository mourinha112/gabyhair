import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'

// Usar global para persistir entre hot-reloads no Next.js
declare global {
  var io: SocketIOServer | undefined
}

let io: SocketIOServer | null = global.io || null

export const initSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // Armazenar no global para persistir em hot-reloads
  global.io = io

  io.on('connection', (socket) => {
    const { conversationId, type, attendantId } = socket.handshake.query

    console.log(`Cliente conectado: ${socket.id}, tipo: ${type}, conversationId: ${conversationId}`)

    if (type === 'client' && conversationId) {
      socket.join(`conversation:${conversationId}`)
      console.log(`Cliente ${socket.id} entrou no room conversation:${conversationId}`)
    }

    if (type === 'attendant' && attendantId) {
      socket.join(`attendant:${attendantId}`)
      socket.join('attendants') // Room para todos os atendentes
      console.log(`Atendente ${socket.id} entrou nos rooms`)
    }

    // Permitir que clientes reentrem no room após reconexão
    socket.on('rejoin-conversation', (data: { conversationId: string }) => {
      if (type === 'client') {
        socket.join(`conversation:${data.conversationId}`)
        console.log(`Cliente ${socket.id} reentrou no room conversation:${data.conversationId}`)
      }
    })

    // Escutar novas mensagens
    socket.on('message', async (data) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            sender: data.sender,
            type: data.type || 'text',
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            fileSize: data.fileSize || null,
            conversationId: data.conversationId,
          },
          include: {
            conversation: true,
          },
        })

        // Atualizar última mensagem da conversa
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        })

        // Enviar mensagem para todos na conversa
        io?.to(`conversation:${data.conversationId}`).emit('message', {
          id: message.id,
          content: message.content,
          type: message.type,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          fileSize: message.fileSize,
          sender: message.sender,
          createdAt: message.createdAt.toISOString(),
        })

        // Notificar atendentes sobre nova mensagem
        io?.to('attendants').emit('conversation-updated', {
          id: data.conversationId,
          lastMessage: data.content,
          lastMessageTime: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Erro ao processar mensagem:', error)
      }
    })

    // Permitir que atendentes entrem em rooms de conversas dinamicamente
    socket.on('join-conversation', (data: { conversationId: string }) => {
      if (type === 'attendant') {
        socket.join(`conversation:${data.conversationId}`)
        console.log(`Atendente ${socket.id} entrou na conversa ${data.conversationId}`)
      }
    })

    // Permitir sair de uma conversa
    socket.on('leave-conversation', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`)
      console.log(`Socket ${socket.id} saiu da conversa ${data.conversationId}`)
    })

    // Escutar digitação
    socket.on('typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing', {
        isTyping: true,
      })
    })

    socket.on('stop-typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing', {
        isTyping: false,
      })
    })

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`)
    })
  })

  return io
}

export const getIO = (): SocketIOServer | null => {
  // Primeiro tenta usar o global (para hot-reload)
  if (global.io) {
    return global.io
  }
  // Depois tenta usar a variável local
  if (io) {
    return io
  }
  // Retorna null se não estiver inicializado (não lança erro)
  return null
}

