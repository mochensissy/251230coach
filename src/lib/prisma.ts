import { PrismaClient } from '@prisma/client'

// 确保数据库URL在所有环境下都被正确设置
const ensureDatabaseUrl = () => {
  // 如果环境变量已设置，直接使用
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL
  }

  // 使用相对路径的回退URL
  const fallbackUrl = 'file:./prisma/dev.db'
  console.warn(
    '[prisma] DATABASE_URL environment variable not found, using fallback:', fallbackUrl
  )
  console.log('[prisma] Make sure to set DATABASE_URL="file:./prisma/dev.db" in your .env.local file')
  
  // 设置环境变量，以便后续使用
  process.env.DATABASE_URL = fallbackUrl
  return fallbackUrl
}

// 确保数据库URL被正确设置
const dbUrl = ensureDatabaseUrl()
console.log('[prisma] Using database URL:', dbUrl)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // 只记录错误和警告，减少日志输出
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 添加连接测试
export const testDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}
