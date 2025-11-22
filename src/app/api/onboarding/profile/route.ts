import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const createDbNotReadyResponse = (details?: string) =>
  NextResponse.json(
    {
      error: '系统暂时无法保存信息，请联系管理员检查数据库配置后再试',
      details: details || '数据库连接失败',
      suggestion: '请检查数据库配置和连接设置',
    },
    { status: 503 }
  )

export async function POST(request: NextRequest) {
  // 首先检查数据库URL是否存在
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not defined')
    return createDbNotReadyResponse('DATABASE_URL环境变量未设置')
  }

  console.log('Processing onboarding request with DATABASE_URL:', process.env.DATABASE_URL)

  try {
    const body = await request.json()
    const {
      username,
      email,
      role,
      businessLine,
      workStyle,
      developmentGoal,
      workChallenge,
    } = body

    // 验证必填字段
    if (!username) {
      return NextResponse.json(
        { error: '用户名是必填项' },
        { status: 400 }
      )
    }

    console.log('Creating/updating user:', username)

    // 创建或更新用户
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        email,
        role,
        businessLine,
        workStyle,
        developmentGoal,
        workChallenge,
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
      create: {
        username,
        email,
        role,
        businessLine,
        workStyle,
        developmentGoal,
        workChallenge,
        onboardingCompleted: true,
      },
    })

    console.log('User created/updated successfully:', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Onboarding error:', error)

    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('Prisma initialization error:', error.message)
      return createDbNotReadyResponse('Prisma客户端初始化失败')
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: '该用户名已存在，请换一个再试' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '保存用户信息失败，请稍后再试' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined')
    return createDbNotReadyResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: '用户名是必填项' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        businessLine: true,
        workStyle: true,
        developmentGoal: true,
        workChallenge: true,
        onboardingCompleted: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return createDbNotReadyResponse()
    }

    return NextResponse.json(
      { error: '获取用户信息失败，请稍后再试' },
      { status: 500 }
    )
  }
}
