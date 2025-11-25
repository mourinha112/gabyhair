import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, startOfMonth, subMonths, format } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const today = startOfDay(now)
    const thisMonth = startOfMonth(now)

    // Total de leads (todas as conversas)
    const totalLeads = await prisma.conversation.count()

    // Leads hoje
    const leadsToday = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    })

    // Leads este mês
    const leadsThisMonth = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: thisMonth,
        },
      },
    })

    // Leads últimos 7 dias (para gráfico)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const nextDate = subDays(today, i - 1)
      
      const count = await prisma.conversation.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      })
      
      last7Days.push({
        date: format(date, 'dd/MM'),
        count,
      })
    }

    // Leads por status
    const byStatus = await prisma.conversation.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalLeads,
      leadsToday,
      leadsThisMonth,
      last7Days,
      statusCounts,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}

