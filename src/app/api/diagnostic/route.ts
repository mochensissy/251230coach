import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    const envCheck = {
      databaseUrl: process.env.DATABASE_URL ? '已设置' : '未设置',
      databaseUrlValue: process.env.DATABASE_URL || '未设置',
      nodeEnv: process.env.NODE_ENV || '未设置',
    }

    // 测试数据库连接
    let dbConnection = false
    let dbError = null
    
    try {
      await prisma.$queryRaw`SELECT 1`
      dbConnection = true
    } catch (error) {
      dbError = (error as Error).message
    }

    // 检查数据库表
    let tableCheck = {}
    if (dbConnection) {
      try {
        const userCount = await prisma.user.count()
        tableCheck = {
          users: {
            exists: true,
            count: userCount,
          }
        }
      } catch (error) {
        tableCheck = {
          users: {
            exists: false,
            error: (error as Error).message,
          }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connection: dbConnection,
        error: dbError,
        tables: tableCheck,
      },
      suggestions: dbConnection ? 
        ['数据库连接正常'] : 
        ['检查DATABASE_URL环境变量', '确认数据库文件存在', '运行 npx prisma db push'],
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
