'use client'

import { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import ChatInterface from './ChatInterface'
import ConversationList from './ConversationList'
import CRMStats from './CRMStats'
import LeadsList from './LeadsList'

interface Conversation {
  id: string
  clientName: string
  clientPhone: string
  status: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface AttendantPanelProps {
  socket: Socket
  attendantId: string
  onLogout?: () => void
}

type TabType = 'waiting' | 'active' | 'closed' | 'crm' | 'leads'

export default function AttendantPanel({ socket, attendantId, onLogout }: AttendantPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedClientName, setSelectedClientName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabType>('waiting')

  useEffect(() => {
    // Carregar conversas
    loadConversations()

    // Escutar novas conversas
    socket.on('new-conversation', (conversation: Conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id)
        if (exists) return prev
        return [conversation, ...prev]
      })
    })

    // Escutar atualizações de conversas
    socket.on('conversation-updated', (conversation: Conversation) => {
      setConversations((prev) =>
        prev.map((c) => 
          c.id === conversation.id 
            ? { ...c, ...conversation, status: conversation.status || c.status }
            : c
        )
      )
    })

    // Escutar atualizações de status
    socket.on('conversation-status-updated', (data: { id: string; status: string }) => {
      setConversations((prev) =>
        prev.map((c) => 
          c.id === data.id ? { ...c, status: data.status } : c
        )
      )
    })

    return () => {
      socket.off('new-conversation')
      socket.off('conversation-updated')
      socket.off('conversation-status-updated')
    }
  }, [socket])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  const handleSelectConversation = async (conversationId: string, clientName: string) => {
    setSelectedConversation(conversationId)
    setSelectedClientName(clientName)

    // Entrar no room da conversa imediatamente para receber mensagens em tempo real
    socket.emit('join-conversation', { conversationId })

    // Se a conversa ainda está como waiting, atribuir ao atendente
    const currentConversation = conversations.find(c => c.id === conversationId)
    if (currentConversation?.status === 'waiting') {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ attendantId }),
        })

        if (response.ok) {
          const data = await response.json()
          // Atualizar status da conversa
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, status: data.conversation?.status || 'active' } : c
            )
          )
        }
      } catch (error) {
        console.error('Erro ao atribuir conversa:', error)
      }
    }
  }

  const waitingConversations = conversations.filter((c) => c.status === 'waiting')
  const activeConversations = conversations.filter((c) => c.status === 'active')
  const closedConversations = conversations.filter((c) => ['closed', 'completed', 'sold', 'cancelled'].includes(c.status))

  if (selectedConversation) {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-[#eb048b] text-white px-4 py-3 flex items-center">
          <button
            onClick={() => {
              // Sair do room da conversa quando voltar para a lista
              if (selectedConversation) {
                socket.emit('leave-conversation', { conversationId: selectedConversation })
              }
              setSelectedConversation(null)
              loadConversations()
            }}
            className="mr-3 p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="font-semibold text-lg">Conversas</h1>
        </div>
        <ChatInterface
          socket={socket}
          conversationId={selectedConversation}
          clientName={selectedClientName}
          isClient={false}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header Principal */}
      <div className="bg-[#eb048b] text-white shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-md">
              <img 
                src="/gabylogo.jpg" 
                alt="Logo" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  e.currentTarget.innerHTML = '<svg class="w-5 h-5 text-[#eb048b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>'
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Gaby Hair</h1>
              <p className="text-[10px] text-white text-opacity-90 mt-0.5 uppercase tracking-wider">Painel Administrativo</p>
            </div>
          </div>
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition text-white text-opacity-90 hover:text-opacity-100"
              title="Sair"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {/* Abas */}
        <div className="flex px-2 space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('waiting')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === 'waiting'
                ? 'bg-gray-100 text-red-600'
                : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {waitingConversations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
            <span>Aguardando</span>
            {waitingConversations.length > 0 && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'waiting' ? 'bg-red-100 text-red-600' : 'bg-white bg-opacity-20 text-white'}`}>
                {waitingConversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === 'active'
                ? 'bg-gray-100 text-green-600'
                : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Em Atendimento</span>
            {activeConversations.length > 0 && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-green-100 text-green-600' : 'bg-white bg-opacity-20 text-white'}`}>
                {activeConversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === 'closed'
                ? 'bg-gray-100 text-gray-600'
                : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Finalizadas</span>
            {closedConversations.length > 0 && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-white bg-opacity-20 text-white'}`}>
                {closedConversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === 'crm'
                ? 'bg-gray-100 text-blue-600'
                : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>CRM Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === 'leads'
                ? 'bg-gray-100 text-purple-600'
                : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Base de Leads</span>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        {activeTab === 'waiting' && (
          <ConversationList
            conversations={waitingConversations}
            onSelectConversation={handleSelectConversation}
            variant="waiting"
            waitingCount={waitingConversations.length}
          />
        )}
        {activeTab === 'active' && (
          <ConversationList
            conversations={activeConversations}
            onSelectConversation={handleSelectConversation}
            variant="active"
            waitingCount={0}
          />
        )}
        {activeTab === 'closed' && (
          <ConversationList
            conversations={closedConversations}
            onSelectConversation={handleSelectConversation}
            variant="closed"
            waitingCount={0}
          />
        )}
        {activeTab === 'crm' && <CRMStats />}
        {activeTab === 'leads' && <LeadsList onSelectConversation={handleSelectConversation} />}
      </div>
    </div>
  )
}
