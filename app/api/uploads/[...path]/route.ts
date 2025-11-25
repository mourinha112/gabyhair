import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import mime from 'mime'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path
    const filePath = join(process.cwd(), 'public', 'uploads', ...pathSegments)

    if (!existsSync(filePath)) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const contentType = mime.getType(filePath) || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Erro ao ler arquivo:', error)
    return new NextResponse('Erro interno', { status: 500 })
  }
}

