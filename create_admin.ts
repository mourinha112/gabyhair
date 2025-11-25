import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'gabyhair'
  const password = 'F@nsro1233' // Nova senha solicitada
  const email = `${username}@atendente.local`

  console.log(`Criando/Atualizando admin: ${username}...`)

  const hashedPassword = await bcrypt.hash(password, 10)

  const attendant = await prisma.attendant.upsert({
    where: { email: email },
    update: {
      password: hashedPassword,
      name: 'Gaby Hair Admin'
    },
    create: {
      name: 'Gaby Hair Admin',
      email: email,
      password: hashedPassword,
      online: false,
    },
  })

  console.log('Admin criado/atualizado com sucesso!')
  console.log('ID:', attendant.id)
  console.log('Email:', attendant.email)
  console.log('Senha:', password)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

