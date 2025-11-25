'use client'

import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import AudioRecorder from './AudioRecorder'

interface Message {
  id: string
  content: string
  type?: string
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  sender: 'client' | 'attendant'
  createdAt: string
}

interface ChatInterfaceProps {
  socket: Socket
  conversationId: string
  clientName?: string
  attendantName?: string
  isClient: boolean
}

export default function ChatInterface({
  socket,
  conversationId,
  clientName,
  attendantName,
  isClient,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [conversationStatus, setConversationStatus] = useState<string>('active')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Se for atendente, entrar no room da conversa para receber mensagens em tempo real
    if (!isClient && conversationId) {
      socket.emit('join-conversation', { conversationId })
      console.log(`Atendente entrou na conversa ${conversationId}`)
    }

    // Se for cliente, garantir que está no room (útil após reconexão)
    if (isClient && conversationId && socket.connected) {
      socket.emit('rejoin-conversation', { conversationId })
      console.log(`Cliente garantiu entrada no room da conversa ${conversationId}`)
    }

    // Carregar status da conversa
    if (!isClient) {
      console.log('Versão com API de Uploads: 1.0') // Log de confirmação
      fetch(`/api/conversations/${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.conversation) {
            setConversationStatus(data.conversation.status || 'active')
          }
        })
        .catch((error) => console.error('Erro ao carregar conversa:', error))
    }

    // Carregar mensagens existentes
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages)
        }
      })
      .catch((error) => console.error('Erro ao carregar mensagens:', error))

    // Função para processar nova mensagem
    const handleNewMessage = (message: Message) => {
      console.log('Nova mensagem recebida:', message)
      setMessages((prev) => {
        // Evitar duplicatas por ID
        if (prev.some((m) => m.id === message.id)) {
          console.log('Mensagem duplicada ignorada:', message.id)
          return prev
        }
        
        // Se é uma mensagem real e existe uma temporária similar, substituir
        if (!message.id.startsWith('temp-')) {
          const tempIndex = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.sender === message.sender &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000
          )
          
          if (tempIndex !== -1) {
            const newMessages = [...prev]
            newMessages[tempIndex] = message
            return newMessages
          }
        }
        
        return [...prev, message]
      })
    }

    // Escutar novas mensagens do socket
    socket.on('message', handleNewMessage)

    // Escutar mensagens do evento customizado (para garantir que funciona mesmo após reconexão)
    const handleCustomMessage = (event: CustomEvent) => {
      handleNewMessage(event.detail as Message)
    }
    window.addEventListener('new-message', handleCustomMessage as EventListener)

    // Escutar status de digitação
    socket.on('typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping)
    })

    // Escutar atualizações de status
    socket.on('conversation-status-updated', (data: { id: string; status: string }) => {
      if (data.id === conversationId) {
        setConversationStatus(data.status)
      }
    })

    // Reconectar e recarregar mensagens ao reconectar
    socket.on('connect', () => {
      console.log('Socket reconectado no ChatInterface')
      // Se for cliente, garantir que está no room
      if (isClient && conversationId) {
        socket.emit('rejoin-conversation', { conversationId })
      }
      // Recarregar mensagens ao reconectar
      fetch(`/api/conversations/${conversationId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setMessages(data.messages)
          }
        })
        .catch((error) => console.error('Erro ao recarregar mensagens:', error))
    })

    // Polling como fallback para mobile (verificar novas mensagens a cada 3 segundos se socket não estiver conectado)
    const pollingInterval = setInterval(() => {
      if (!socket.connected && isClient) {
        // Verificar se há novas mensagens
        fetch(`/api/conversations/${conversationId}/messages`)
          .then((res) => res.json())
          .then((data) => {
            if (data.messages) {
              setMessages((prev) => {
                // Verificar se há mensagens novas
                const newMessages = data.messages.filter((msg: Message) => 
                  !prev.some(m => m.id === msg.id)
                )
                if (newMessages.length > 0) {
                  console.log('Novas mensagens encontradas via polling:', newMessages.length)
                  return [...prev, ...newMessages]
                }
                return prev
              })
            }
          })
          .catch((error) => console.error('Erro ao verificar mensagens:', error))
      }
    }, 3000) // Verificar a cada 3 segundos

    // Escutar evento customizado de reconexão
    const handleSocketReconnected = () => {
      fetch(`/api/conversations/${conversationId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setMessages(data.messages)
          }
        })
        .catch((error) => console.error('Erro ao recarregar mensagens:', error))
    }

    window.addEventListener('socket-reconnected', handleSocketReconnected)

    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      clearInterval(pollingInterval)
      socket.off('message')
      socket.off('typing')
      socket.off('conversation-status-updated')
      socket.off('connect')
      window.removeEventListener('socket-reconnected', handleSocketReconnected)
      window.removeEventListener('new-message', handleCustomMessage as EventListener)
      document.removeEventListener('mousedown', handleClickOutside)
      // Sair do room quando sair do chat
      if (!isClient && conversationId) {
        socket.emit('leave-conversation', { conversationId })
      }
    }
  }, [socket, conversationId, isClient])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e?: React.FormEvent, content?: string, type: string = 'text', fileUrl?: string, fileName?: string, fileSize?: number) => {
    if (e) e.preventDefault()
    
    const messageContent = content || inputMessage.trim()
    // Permitir envio de mídia sem conteúdo
    if (!messageContent && !fileUrl) return

    const tempId = `temp-${Date.now()}`
    const sender = isClient ? 'client' : 'attendant'
    
    // Adicionar mensagem otimisticamente (aparece imediatamente)
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent || (type === 'image' ? '📷 Foto' : type === 'video' ? '🎥 Vídeo' : type === 'audio' ? '🎤 Áudio' : ''),
      type: type,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      sender: sender,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    if (!content) setInputMessage('')
    socket.emit('stop-typing', { conversationId })

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          sender: sender,
          type: type,
          fileUrl: fileUrl,
          fileName: fileName,
          fileSize: fileSize,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Substituir mensagem temporária pela real
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? data.message : msg
          )
        )
      } else {
        // Remover mensagem otimista em caso de erro
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        alert('Erro ao enviar mensagem. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      // Remover mensagem otimista em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      alert('Erro ao enviar mensagem. Tente novamente.')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // Determinar tipo de arquivo
      let fileType = 'image'
      if (file.type.startsWith('video/')) {
        fileType = 'video'
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio'
      }

      // Fazer upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload')
      }

      const uploadData = await uploadResponse.json()

      // Enviar mensagem com arquivo
      await handleSendMessage(
        undefined,
        '',
        fileType,
        uploadData.url,
        uploadData.fileName,
        uploadData.fileSize
      )
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error)
      alert('Erro ao enviar arquivo. Tente novamente.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAudioComplete = async (audioBlob: Blob) => {
    setShowAudioRecorder(false)
    setUploading(true)

    try {
      // Converter blob para File
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' })

      // Fazer upload
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('type', 'audio')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload')
      }

      const uploadData = await uploadResponse.json()

      // Enviar mensagem com áudio
      await handleSendMessage(
        undefined,
        '',
        'audio',
        uploadData.url,
        uploadData.fileName,
        uploadData.fileSize
      )
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      alert('Erro ao enviar áudio. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleTyping = () => {
    socket.emit('typing', { conversationId, isTyping: true })
    
    const timeout = setTimeout(() => {
      socket.emit('stop-typing', { conversationId })
    }, 1000)

    return () => clearTimeout(timeout)
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'HH:mm', { locale: ptBR })
    } catch {
      return ''
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setConversationStatus(newStatus)
        setShowStatusMenu(false)
        // Notificar via socket
        socket.emit('conversation-status-updated', {
          id: conversationId,
          status: newStatus,
        })
      } else {
        alert('Erro ao atualizar status da conversa')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da conversa')
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      waiting: 'Aguardando',
      active: 'Em Atendimento',
      closed: 'Encerrada',
      completed: 'Atendimento Finalizado',
      sold: 'Venda Finalizada',
      cancelled: 'Cancelada',
    }
    return labels[status] || status
  }

  const statusOptions = [
    { value: 'active', label: 'Em Atendimento', icon: '🟢' },
    { value: 'completed', label: 'Atendimento Finalizado', icon: '✅' },
    { value: 'sold', label: 'Venda Finalizada', icon: '💰' },
    { value: 'closed', label: 'Encerrar Conversa', icon: '🔒' },
    { value: 'cancelled', label: 'Cancelar', icon: '❌' },
  ]

  const displayName = isClient ? 'Atendente Gaby Hair' : (clientName || 'Cliente')

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image' && message.fileUrl) {
      return (
        <div>
          <img
            src={`/api/uploads/${message.fileUrl.replace(/^\/uploads\//, '').replace(/^\//, '')}`}
            alt="Imagem enviada"
            className="max-w-full rounded-lg mb-1"
            style={{ maxHeight: '300px' }}
          />
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words mt-1">
              {message.content}
            </p>
          )}
        </div>
      )
    }

    if (message.type === 'video' && message.fileUrl) {
      return (
        <div>
          <video
            src={`/api/uploads/${message.fileUrl.replace(/^\/uploads\//, '').replace(/^\//, '')}`}
            controls
            className="max-w-full rounded-lg mb-1"
            style={{ maxHeight: '300px' }}
          />
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words mt-1">
              {message.content}
            </p>
          )}
        </div>
      )
    }

    if (message.type === 'audio' && message.fileUrl) {
      return (
        <div className="flex items-center space-x-2">
          <audio src={`/api/uploads/${message.fileUrl.replace(/^\/uploads\//, '').replace(/^\//, '')}`} controls className="flex-1" />
        </div>
      )
    }

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </p>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-whatsapp-gray-light whatsapp-bg">
      {/* Header */}
      <div className={`${!isClient ? 'bg-[#eb048b]' : 'bg-whatsapp-green-dark'} text-white px-4 py-3 shadow-md relative`}>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 overflow-hidden">
            {isClient && !logoError ? (
              <img
                src="/gabylogo.jpg"
                alt="Gaby Hair Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                clipRule="evenodd"
              />
            </svg>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{displayName}</h1>
            <div className="flex items-center space-x-2">
            <p className="text-xs text-white text-opacity-90">
              {isClient ? (isTyping ? 'digitando...' : 'online') : 'online'}
            </p>
              {!isClient && (
                <>
                  <span className="text-xs text-white text-opacity-70">•</span>
                  <span className="text-xs text-white text-opacity-90">
                    {getStatusLabel(conversationStatus)}
                  </span>
                </>
              )}
            </div>
          </div>
          {!isClient && (
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition"
                title="Opções de status"
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
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Status Atual: {getStatusLabel(conversationStatus)}
                      </p>
                    </div>
                    {statusOptions
                      .filter((opt) => opt.value !== conversationStatus)
                      .map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleUpdateStatus(option.value)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center space-x-3"
                        >
                          <span className="text-xl">{option.icon}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {option.label}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-2">Comece a conversar!</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwnMessage = message.sender === (isClient ? 'client' : 'attendant')
          const showDate =
            index === 0 ||
            new Date(message.createdAt).toDateString() !==
              new Date(messages[index - 1].createdAt).toDateString()

          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="bg-white bg-opacity-60 px-3 py-1 rounded-full text-xs text-gray-600">
                    {format(new Date(message.createdAt), "dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwnMessage
                      ? 'bg-whatsapp-green-light text-gray-800'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {renderMessageContent(message)}
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-gray-600' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && !isClient && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio Recorder */}
      {showAudioRecorder && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-300">
          <AudioRecorder
            onRecordingComplete={handleAudioComplete}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-gray-100 px-4 py-3 border-t border-gray-300"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-whatsapp-green-dark hover:text-whatsapp-green p-2 disabled:opacity-50"
            title="Enviar foto ou vídeo"
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value)
              handleTyping()
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            placeholder="Digite aqui..."
            className="flex-1 bg-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            disabled={uploading}
          />

          {!inputMessage.trim() && !showAudioRecorder ? (
            <button
              type="button"
              onClick={() => setShowAudioRecorder(true)}
              className="text-whatsapp-green-dark hover:text-whatsapp-green p-2"
              title="Enviar áudio"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputMessage.trim() || uploading}
              className="bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
