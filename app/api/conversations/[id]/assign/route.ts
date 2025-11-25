import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { attendantId } = body

    if (!attendantId) {
      return NextResponse.json(
        { error: 'ID do atendente é obrigatório' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: {
        attendantId,
        status: 'active',
      },
    })

    // Notificar via WebSocket
    const io = getIO()
    if (io) {
      try {
        io.to(`conversation:${params.id}`).emit('conversation-assigned', {
          id: conversation.id,
          status: conversation.status,
        })

        io.to('attendants').emit('conversation-updated', {
          id: conversation.id,
          status: conversation.status,
        })
      } catch (socketError) {
        console.error('Erro ao notificar via socket:', socketError)
      }
    } else {
      console.warn('Socket.IO não está inicializado. Conversa atribuída, mas não será notificada em tempo real.')
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Erro ao atribuir conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao atribuir conversa' },
      { status: 500 }
    )
  }
}


