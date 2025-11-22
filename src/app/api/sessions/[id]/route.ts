import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 兼容 Next.js 15 的新参数格式
    let id: string
    if (context.params && typeof context.params === 'object' && 'then' in context.params) {
      // Next.js 15: params 是 Promise
      const resolvedParams = await context.params
      id = resolvedParams.id
    } else if (context.params && typeof context.params.id === 'string') {
      // 兼容性：直接对象
      id = context.params.id
    } else {
      // 从 URL 路径中直接获取
      const url = new URL(request.url)
      const pathSegments = url.pathname.split('/')
      id = pathSegments[pathSegments.length - 1]
    }
    
    const sessionId = parseInt(id)

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: '无效的会话 ID' },
        { status: 400 }
      )
    }

    // 获取会话信息和历史消息
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            businessLine: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        scenario: session.scenario,
        status: session.status,
        currentPhase: session.currentPhase,
        startedAt: session.startedAt,
        messageCount: session.messageCount,
        user: session.user,
        messages: session.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          phase: msg.phase,
          createdAt: msg.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: '获取会话失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
