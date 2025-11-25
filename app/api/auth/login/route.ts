import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar atendente no banco de dados (Supabase)
    // Assumindo que o username é usado como parte do email ou verificamos se existe um campo username se você adicionar depois
    // Por enquanto mantemos a lógica de email baseada no username
    const email = `${username}@atendente.local`
    
    const attendant = await prisma.attendant.findFirst({
      where: { 
        OR: [
          { email: email },
          { email: username } // Permite logar com email direto também
        ]
      },
    })

    if (attendant && (await bcrypt.compare(password, attendant.password))) {
      // Login com sucesso
      
      // Atualizar status online
      await prisma.attendant.update({
        where: { id: attendant.id },
        data: { online: true },
      })

      return NextResponse.json({
        success: true,
        attendant: {
          id: attendant.id,
          name: attendant.name,
          email: attendant.email,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Usuário ou senha incorretos' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}

