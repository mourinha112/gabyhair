'use client'

import { useState } from 'react'

interface WelcomeModalProps {
  onStart: (name: string, phone: string) => void
}

export default function WelcomeModal({ onStart }: WelcomeModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !phone.trim()) {
      alert('Por favor, preencha todos os campos')
      return
    }

    // Validação simples de telefone
    const phoneRegex = /^[\d\s\(\)\-\+]+$/
    if (!phoneRegex.test(phone)) {
      alert('Por favor, insira um número de telefone válido')
      return
    }

    setLoading(true)
    try {
      await onStart(name.trim(), phone.trim())
    } catch (error) {
      console.error(error)
      alert('Erro ao iniciar conversa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/gabylogo.jpg"
              alt="Gaby Hair Logo"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // Fallback se a imagem não carregar
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-20 h-20 bg-whatsapp-green rounded-full flex items-center justify-center">
                      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                    </div>
                  `
                }
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bem-vindo!
          </h2>
          <p className="text-gray-600">
            Preencha seus dados para começar a conversar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Seu Nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent outline-none transition"
              placeholder="Digite seu nome"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Número do WhatsApp
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent outline-none transition"
              placeholder="(00) 00000-0000"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-whatsapp-green hover:bg-whatsapp-green-dark text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Conectando...
              </>
            ) : (
              'Começar Conversa'
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}


