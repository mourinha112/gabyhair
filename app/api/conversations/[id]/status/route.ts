import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    // Status válidos
    const validStatuses = ['waiting', 'active', 'closed', 'completed', 'sold', 'cancelled']
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: waiting, active, closed, completed, sold, cancelled' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: {
        status,
      },
    })

    // Notificar via WebSocket
    const io = getIO()
    if (io) {
      try {
        io.to(`conversation:${params.id}`).emit('conversation-status-updated', {
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
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Erro ao atualizar status da conversa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar status da conversa' },
      { status: 500 }
    )
  }
}

