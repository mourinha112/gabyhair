import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const leads = await prisma.conversation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      clientName: lead.clientName,
      clientPhone: lead.clientPhone,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
      lastMessageTime: lead.updatedAt.toISOString(),
      messageCount: lead._count.messages
    }))

    return NextResponse.json({ leads: formattedLeads })
  } catch (error) {
    console.error('Erro ao buscar leads:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    )
  }
}

