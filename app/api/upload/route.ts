import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image', 'video', 'audio'

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Criar diretório se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', type)
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
    } catch (error) {
      console.error('Erro ao criar diretório:', error)
      // Tentar criar diretório pai também
      const parentDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(parentDir)) {
        await mkdir(parentDir, { recursive: true })
      }
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // URL pública do arquivo
    const fileUrl = `/uploads/${type}/${fileName}`

    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      type,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}

