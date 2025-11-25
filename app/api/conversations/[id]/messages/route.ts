import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      sender: msg.sender,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content, sender, type, fileUrl, fileName, fileSize } = body

    if (!sender) {
      return NextResponse.json(
        { error: 'Remetente é obrigatório' },
        { status: 400 }
      )
    }

    // Para mensagens de mídia, content pode ser vazio
    const messageContent = content || (fileUrl ? (type === 'image' ? '📷 Foto' : type === 'video' ? '🎥 Vídeo' : type === 'audio' ? '🎤 Áudio' : 'Arquivo') : '')
    
    if (!messageContent && !fileUrl) {
      return NextResponse.json(
        { error: 'Conteúdo ou arquivo é obrigatório' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content: messageContent,
        sender,
        type: type || 'text',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        conversationId: params.id,
      },
    })

    // Atualizar última atualização da conversa
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    // Enviar via WebSocket
    const io = getIO()
    if (io) {
    try {
      io.to(`conversation:${params.id}`).emit('message', {
        id: message.id,
        content: message.content,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      })

      // Notificar atendentes
      io.to('attendants').emit('conversation-updated', {
        id: params.id,
          lastMessage: message.content,
        lastMessageTime: new Date().toISOString(),
      })
    } catch (socketError) {
      console.error('Erro ao enviar via socket:', socketError)
      }
    } else {
      console.warn('Socket.IO não está inicializado. Mensagem salva, mas não será enviada em tempo real.')
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao criar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao criar mensagem' },
      { status: 500 }
    )
  }
}

