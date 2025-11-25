'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import AttendantPanel from '@/components/AttendantPanel'
import AttendantLogin from '@/components/AttendantLogin'

const ATTENDANT_SESSION_KEY = 'attendant_session'

export default function AttendantPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [attendantId, setAttendantId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)

  // Verificar sessão salva ao carregar
  useEffect(() => {
    const session = localStorage.getItem(ATTENDANT_SESSION_KEY)
    if (session) {
      try {
        const parsed = JSON.parse(session)
        if (parsed.attendantId && parsed.name) {
          setAttendantId(parsed.attendantId)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error)
        localStorage.removeItem(ATTENDANT_SESSION_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Configurar socket quando autenticado
  useEffect(() => {
    if (isAuthenticated && attendantId) {
      const createSocket = () => {
        // Fechar socket anterior se existir
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.close()
        }

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
          query: {
            attendantId: attendantId,
            type: 'attendant',
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity,
        })

        newSocket.on('connect', () => {
          console.log('Socket do atendente conectado:', newSocket.id)
        })

        socketRef.current = newSocket
        setSocket(newSocket)
      }

      createSocket()

      return () => {
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.close()
        }
      }
    }
  }, [isAuthenticated, attendantId])

  const handleLogin = async (username: string, password: string) => {
    setLoginError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const sessionData = {
          attendantId: data.attendant.id,
          name: data.attendant.name,
          email: data.attendant.email,
        }
        localStorage.setItem(ATTENDANT_SESSION_KEY, JSON.stringify(sessionData))
        setAttendantId(data.attendant.id)
        setIsAuthenticated(true)
      } else {
        setLoginError(data.error || 'Usuário ou senha incorretos')
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      setLoginError('Erro ao fazer login. Tente novamente.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ATTENDANT_SESSION_KEY)
    if (socketRef.current) {
      socketRef.current.close()
    }
    setSocket(null)
    setAttendantId(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AttendantLogin onLogin={handleLogin} error={loginError} />
  }

  if (!socket || !attendantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando...</p>
        </div>
      </div>
    )
  }

  return <AttendantPanel socket={socket} attendantId={attendantId} onLogout={handleLogout} />
}


