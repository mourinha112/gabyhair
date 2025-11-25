'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  totalLeads: number
  leadsToday: number
  leadsThisMonth: number
  last7Days: { date: string; count: number }[]
  statusCounts: Record<string, number>
}

export default function CRMStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Erro ao carregar dados
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard CRM</h2>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Leads Hoje</h3>
            <span className="bg-green-100 text-green-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.leadsToday}</p>
          <p className="text-sm text-gray-500 mt-2">Novos contatos nas últimas 24h</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Leads Este Mês</h3>
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.leadsThisMonth}</p>
          <p className="text-sm text-gray-500 mt-2">Acumulado do mês atual</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total de Leads</h3>
            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalLeads}</p>
          <p className="text-sm text-gray-500 mt-2">Desde o início do sistema</p>
        </div>
      </div>

      {/* Gráfico Simplificado (Barras CSS) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Últimos 7 Dias</h3>
        <div className="flex items-end justify-between h-64 space-x-2">
          {stats.last7Days.map((day, index) => {
            const max = Math.max(...stats.last7Days.map(d => d.count), 1)
            const height = (day.count / max) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div 
                    className="w-full max-w-[40px] bg-whatsapp-green rounded-t-md transition-all duration-300 hover:bg-whatsapp-green-dark relative group-hover:shadow-lg"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">{day.date}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Distribuição por Status</h3>
        <div className="space-y-4">
          {Object.entries(stats.statusCounts).map(([status, count]) => {
            const labels: Record<string, string> = {
              waiting: 'Aguardando',
              active: 'Em Atendimento',
              closed: 'Encerrada',
              completed: 'Finalizada',
              sold: 'Venda Finalizada',
              cancelled: 'Cancelada'
            }
            const colors: Record<string, string> = {
              waiting: 'bg-red-500',
              active: 'bg-green-500',
              closed: 'bg-gray-500',
              completed: 'bg-blue-500',
              sold: 'bg-yellow-500',
              cancelled: 'bg-red-800'
            }
            
            const percentage = ((count / stats.totalLeads) * 100).toFixed(1)
            
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{labels[status] || status}</span>
                  <span className="text-gray-500">{count} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${colors[status] || 'bg-gray-500'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

