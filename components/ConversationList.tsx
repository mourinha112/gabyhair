'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface Conversation {
  id: string
  clientName: string
  clientPhone: string
  status: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface ConversationListProps {
  conversations: Conversation[]
  onSelectConversation: (id: string, clientName: string) => void
  variant: 'waiting' | 'active' | 'closed'
  waitingCount?: number
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  variant,
}: ConversationListProps) {
  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: ptBR })
      } else if (diffInHours < 48) {
        return 'Ontem'
      } else {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
      }
    } catch {
      return ''
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      closed: 'Encerrada',
      completed: 'Finalizada',
      sold: 'Venda Finalizada',
      cancelled: 'Cancelada',
    }
    return labels[status] || 'Finalizada'
  }

  const config = {
    waiting: {
      gradient: 'from-red-500 to-orange-500',
      border: 'border-l-red-500',
      hover: 'hover:bg-yellow-50 active:bg-yellow-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: 'Clientes Aguardando',
      badge: 'bg-red-600',
      tag: {
        text: 'NOVO',
        bg: 'bg-red-500',
        animate: 'animate-pulse'
      },
      opacity: ''
    },
    active: {
      gradient: 'from-green-500 to-emerald-500',
      border: 'border-l-green-500',
      hover: 'hover:bg-green-50 active:bg-green-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Em Atendimento',
      badge: 'bg-green-600',
      tag: {
        text: 'ATIVO',
        bg: 'bg-green-500',
        animate: ''
      },
      opacity: ''
    },
    closed: {
      gradient: 'from-gray-400 to-gray-500',
      border: 'border-l-gray-400',
      hover: 'hover:bg-gray-50 active:bg-gray-100',
      opacity: 'opacity-75',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Finalizadas',
      badge: 'bg-gray-600',
      tag: {
        text: 'FINALIZADA', // Será dinâmico
        bg: 'bg-gray-400',
        animate: ''
      }
    }
  }

  const currentConfig = config[variant]

  return (
    <div className="flex-1 overflow-y-auto h-full">
      {conversations.length > 0 ? (
        <div className="mb-6">
          {/* Sticky Header removido pois agora temos tabs no pai */}
          
          <div className={`bg-white ${currentConfig.opacity || ''}`}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() =>
                  onSelectConversation(conversation.id, conversation.clientName)
                }
                className={`px-4 py-4 border-b border-gray-200 cursor-pointer ${currentConfig.hover} transition-all border-l-4 ${currentConfig.border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {conversation.clientName}
                      </h3>
                      <span className={`flex-shrink-0 text-white text-xs font-semibold px-2.5 py-1 rounded-full ${currentConfig.tag.bg} ${currentConfig.tag.animate}`}>
                        {variant === 'closed' ? getStatusLabel(conversation.status).toUpperCase() : currentConfig.tag.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      📞 {conversation.clientPhone}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-700 truncate font-medium">
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs font-semibold text-gray-600">
                      {formatTime(conversation.lastMessageTime)}
                    </p>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-whatsapp-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg font-medium">Nenhuma conversa nesta categoria</p>
        </div>
      )}
    </div>
  )
}
