import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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
      session,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: '获取会话失败' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: '缺少status参数' },
        { status: 400 }
      )
    }

    // 更新session状态
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status,
        endedAt: status === 'completed' ? new Date() : undefined,
        durationMinutes:
          status === 'completed'
            ? Math.round(
                (new Date().getTime() -
                  new Date(
                    (
                      await prisma.session.findUnique({
                        where: { id: sessionId },
                      })
                    )!.startedAt
                  ).getTime()) /
                  1000 /
                  60
              )
            : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { error: '更新会话失败' },
      { status: 500 }
    )
  }
}
