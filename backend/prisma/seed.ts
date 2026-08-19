import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'
const email = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@ilokal.my').trim().toLowerCase()
const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!'
const name = process.env.SEED_SUPER_ADMIN_NAME ?? 'David R.'

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const role = await prisma.role.upsert({
    where: { name: SUPER_ADMIN_ROLE },
    update: {},
    create: { name: SUPER_ADMIN_ROLE },
  })

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
  })

  console.log('Seed completed')
  console.log(`Role: ${role.name}`)
  console.log(`Super Admin: ${user.email}`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
