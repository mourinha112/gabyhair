import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket'

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      clientName: conv.clientName,
      clientPhone: conv.clientPhone,
      status: conv.status,
      lastMessage: conv.messages[0]?.content,
      lastMessageTime: conv.messages[0]?.createdAt.toISOString(),
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, clientPhone } = body

    if (!clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.create({
      data: {
        clientName,
        clientPhone,
        status: 'waiting',
      },
    })

    // Notificar atendentes sobre nova conversa
    const io = getIO()
    if (io) {
      try {
        io.to('attendants').emit('new-conversation', {
          id: conversation.id,
          clientName: conversation.clientName,
          clientPhone: conversation.clientPhone,
          status: conversation.status,
          lastMessageTime: conversation.createdAt.toISOString(),
        })
      } catch (socketError) {
        console.error('Erro ao notificar via socket:', socketError)
      }
    } else {
      console.warn('Socket.IO não está inicializado. Conversa criada, mas não será notificada em tempo real.')
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conversa' },
      { status: 500 }
    )
  }
}


