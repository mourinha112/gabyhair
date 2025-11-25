'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import WelcomeModal from '@/components/WelcomeModal'
import ChatInterface from '@/components/ChatInterface'

const CLIENT_CACHE_KEY = 'chat_client_info'

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showModal, setShowModal] = useState(true)
  const [clientInfo, setClientInfo] = useState<{ name: string; phone: string; conversationId: string } | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Carregar dados do cache ao iniciar
  useEffect(() => {
    const cachedData = localStorage.getItem(CLIENT_CACHE_KEY)
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        if (parsed.name && parsed.phone && parsed.conversationId) {
          setClientInfo(parsed)
          setShowModal(false)
        }
      } catch (error) {
        console.error('Erro ao carregar cache:', error)
        localStorage.removeItem(CLIENT_CACHE_KEY)
      }
    }
  }, [])

  // Salvar no cache sempre que clientInfo mudar
  useEffect(() => {
    if (clientInfo) {
      localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(clientInfo))
    }
  }, [clientInfo])

  // Configurar socket com reconexão automática
  useEffect(() => {
    if (clientInfo) {
      const createSocket = () => {
        // Fechar socket anterior se existir
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.close()
        }

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
          query: {
            conversationId: clientInfo.conversationId,
            type: 'client',
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity,
        })

        newSocket.on('connect', () => {
          console.log('Socket conectado:', newSocket.id)
          // Garantir que está no room correto ao conectar
          if (clientInfo?.conversationId) {
            // Reentrar no room para garantir (útil após reconexão)
            newSocket.emit('rejoin-conversation', { conversationId: clientInfo.conversationId })
            console.log('Cliente conectado na conversa:', clientInfo.conversationId)
          }
          // Disparar evento para recarregar mensagens
          window.dispatchEvent(new CustomEvent('socket-reconnected'))
        })

        newSocket.on('disconnect', () => {
          console.log('Socket desconectado')
        })

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('Socket reconectado após', attemptNumber, 'tentativas')
          // Recarregar mensagens ao reconectar
          if (newSocket.connected && clientInfo?.conversationId) {
            window.dispatchEvent(new CustomEvent('socket-reconnected'))
          }
        })

        // Escutar mensagens diretamente aqui também para garantir que funciona
        newSocket.on('message', (message) => {
          console.log('Mensagem recebida no socket principal:', message)
          window.dispatchEvent(new CustomEvent('new-message', { detail: message }))
        })

        socketRef.current = newSocket
        setSocket(newSocket)
      }

      createSocket()

      // Reconectar quando a página volta a ficar visível (mobile)
      const handleVisibilityChange = () => {
        if (!document.hidden && clientInfo) {
          // Se socket não estiver conectado, reconectar
          if (!socketRef.current || !socketRef.current.connected) {
            console.log('Página voltou a ficar visível, reconectando socket...')
            createSocket()
          }
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Reconectar quando a página volta do cache (mobile)
      const handlePageshow = (event: PageTransitionEvent) => {
        if (event.persisted && clientInfo) {
          console.log('Página restaurada do cache, reconectando socket...')
          createSocket()
        }
      }

      window.addEventListener('pageshow', handlePageshow)

      // Reconectar quando a página volta a ficar ativa
      const handleFocus = () => {
        if (clientInfo && (!socketRef.current || !socketRef.current.connected)) {
          console.log('Página voltou a ficar ativa, reconectando socket...')
          createSocket()
        }
      }

      window.addEventListener('focus', handleFocus)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('pageshow', handlePageshow)
        window.removeEventListener('focus', handleFocus)
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.close()
        }
      }
    }
  }, [clientInfo])

  const handleStartChat = async (name: string, phone: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientName: name, clientPhone: phone }),
      })

      const data = await response.json()
      
      if (data.conversation) {
        const info = {
          name,
          phone,
          conversationId: data.conversation.id,
        }
        setClientInfo(info)
        localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(info))
        setShowModal(false)
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      alert('Erro ao iniciar conversa. Tente novamente.')
    }
  }

  if (showModal) {
    return <WelcomeModal onStart={handleStartChat} />
  }

  if (!clientInfo || !socket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando...</p>
        </div>
      </div>
    )
  }

  return (
    <ChatInterface
      socket={socket}
      conversationId={clientInfo.conversationId}
      clientName={clientInfo.name}
      isClient={true}
    />
  )
}


