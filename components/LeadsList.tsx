'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface Lead {
  id: string
  clientName: string
  clientPhone: string
  status: string
  createdAt: string
  lastMessageTime?: string
  messageCount?: number
}

interface LeadsListProps {
  onSelectConversation: (id: string, clientName: string) => void
}

export default function LeadsList({ onSelectConversation }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      if (data.leads) {
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { text: string; color: string }> = {
      waiting: { text: 'Aguardando', color: 'bg-red-100 text-red-800' },
      active: { text: 'Em Atendimento', color: 'bg-green-100 text-green-800' },
      closed: { text: 'Encerrado', color: 'bg-gray-100 text-gray-800' },
      completed: { text: 'Finalizado', color: 'bg-blue-100 text-blue-800' },
      sold: { text: 'Venda Realizada', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    }

    const config = configs[status] || { text: status, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const filteredLeads = leads.filter(lead => 
    lead.clientName.toLowerCase().includes(filter.toLowerCase()) ||
    lead.clientPhone.includes(filter)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Todos os Leads</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent outline-none w-64"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data Entrada</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-whatsapp-green text-white flex items-center justify-center font-bold text-lg mr-3">
                      {lead.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{lead.clientName}</div>
                      <div className="text-sm text-gray-500">ID: {lead.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {lead.clientPhone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(lead.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onSelectConversation(lead.id, lead.clientName)}
                    className="text-whatsapp-green hover:text-whatsapp-green-dark font-medium text-sm flex items-center"
                  >
                    Ver Conversa
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum lead encontrado.
          </div>
        )}
      </div>
    </div>
  )
}

