import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// 密码哈希函数
function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // 安全检查：只允许在没有管理员的情况下创建
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: '管理员账号已存在，无法重复创建' },
        { status: 400 }
      )
    }

    // 创建管理员账号
    const adminPassword = 'admin123' // 默认密码
    const hashedPassword = hashPassword(adminPassword)

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
        onboardingCompleted: true,
        email: 'admin@coachingpartner.com',
      },
    })

    return NextResponse.json({
      success: true,
      message: '管理员账号创建成功',
      credentials: {
        username: 'admin',
        password: 'admin123',
        note: '请登录后立即修改密码'
      },
      adminId: admin.id,
    })

  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { error: '创建管理员账号失败' },
      { status: 500 }
    )
  }
}

