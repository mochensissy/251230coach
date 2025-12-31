import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, username, npsScore, feedbackText } = body

    if (!sessionId || !username) {
      return NextResponse.json(
        { error: '缺少必填参数' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 创建反馈记录
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        sessionId: parseInt(sessionId),
        npsScore: npsScore || null,
        feedbackText: feedbackText || null,
      },
    })

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (error) {
    console.error('Create feedback error:', error)
    return NextResponse.json(
      { error: '保存反馈失败' },
      { status: 500 }
    )
  }
}


