import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  deepseek,
  buildCoachingSystemPrompt,
  detectGROWPhase,
  getPhaseName,
  type Scenario,
  type CoachingPhase,
  type DeepseekMessage
} from '@/lib/deepseek'

// 使用 Node runtime 因为 Prisma 在 Edge 不支持
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, username } = body

    if (!sessionId || !message || !username) {
      return new Response(
        JSON.stringify({ error: '缺少必填参数' }),
        { status: 400 }
      )
    }

    // 检查 Deepseek API 密钥
    if (!process.env.DEEPSEEK_API_KEY) {
      // 模拟响应用于临时测试
      console.warn('Deepseek API 密钥未配置，使用模拟响应')
      
      // 获取会话信息
      const session = await prisma.session.findUnique({
        where: { id: parseInt(sessionId) },
        include: {
          user: true,
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!session) {
        return new Response(
          JSON.stringify({ error: '会话不存在' }),
          { status: 404 }
        )
      }

      // 保存用户消息
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message,
          phase: session.currentPhase,
        },
      })

      // 更新会话消息计数
      await prisma.session.update({
        where: { id: session.id },
        data: { messageCount: { increment: 1 } },
      })

      // 构建用户画像字符串
      const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}
发展目标：${session.user.developmentGoal || '未设置'}
工作挑战：${session.user.workChallenge || '未设置'}
    `.trim()

      // 构建系统提示词
      const currentPhase = (session.currentPhase || 'goal') as CoachingPhase
      const systemPrompt = buildCoachingSystemPrompt(
        currentPhase,
        session.scenario as Scenario,
        userProfile
      )

      // 构建 Deepseek 消息格式（多轮对话）
      const messages: DeepseekMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ]

      // 添加历史对话
      for (const msg of session.messages) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: message,
      })

      // 模拟 AI 响应（基于当前阶段和对话历史）
      const userMessages = session.messages.filter(m => m.role === 'user')
      const messageCount = userMessages.length
      
      let mockResponse = ''
      
      if (messageCount <= 1) {
        mockResponse = `感谢您与我分享"${message}"。作为您的教练伙伴，我很高兴能陪伴您探索这个话题。

为了更好地支持您，我想先了解几个问题：
1. 对于这个情况，您最希望达成的目标是什么？
2. 目前现状如何？有哪些因素在影响？
3. 您觉得有哪些可能的解决方案？

请选择一个您最想深入探讨的方面，我们一起深入思考。`
      } else if (messageCount <= 3) {
        mockResponse = `我理解您的想法。看起来您已经对这个问题有了更深入的思考。

让我邀请您继续探索：
- 基于您刚才提到的这些，您认为最重要的是什么？
- 如果您采用某种方案，可能会面临什么挑战？
- 您觉得需要什么样的支持来帮助您推进？

请分享更多您的想法。`
      } else {
        mockResponse = `非常感谢您与我分享这么多深入的想法。我能感受到您对解决这个问题是很认真的。

现在让我们思考接下来的行动：
1. 您打算采取的第一步行动是什么？
2. 您希望什么时候开始实施？
3. 有什么可能的障碍，以及您将如何应对？

让我们一起制定一个可行的计划吧！`
      }

      // 保存模拟 AI 响应
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: mockResponse,
          phase: currentPhase,
        },
      })

      // 更新会话消息计数
      await prisma.session.update({
        where: { id: session.id },
        data: { messageCount: { increment: 1 } },
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: mockResponse,
          phase: currentPhase,
          isMock: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取会话信息
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return new Response(
        JSON.stringify({ error: '会话不存在' }),
        { status: 404 }
      )
    }

    // 保存用户消息
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
        phase: session.currentPhase,
      },
    })

    // 更新会话消息计数
    await prisma.session.update({
      where: { id: session.id },
      data: { messageCount: { increment: 1 } },
    })

    // 构建用户画像字符串
    const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}
发展目标：${session.user.developmentGoal || '未设置'}
工作挑战：${session.user.workChallenge || '未设置'}
    `.trim()

    // 构建系统提示词
    const currentPhase = (session.currentPhase || 'goal') as CoachingPhase
    const systemPrompt = buildCoachingSystemPrompt(
      currentPhase,
      session.scenario as Scenario,
      userProfile
    )

    // 构建完整的对话历史（适配 Deepseek 多轮对话格式）
    const messages: DeepseekMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    // 添加历史对话 - 每次请求都传递完整的对话历史
    for (const msg of session.messages) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message,
    })

    console.log('Deepseek API调用，消息历史长度:', messages.length)

    // 调用 Deepseek API（非流式，简化处理）
    const response = await deepseek.chat({
      model: 'deepseek-chat',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    })

    const data = await response.json()
    const fullResponse = data.choices?.[0]?.message?.content

    if (!fullResponse) {
      throw new Error('Deepseek API 返回空响应')
    }

    // 保存 AI 响应到数据库
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: fullResponse,
        phase: currentPhase,
      },
    })

    // 更新会话消息计数
    await prisma.session.update({
      where: { id: session.id },
      data: { messageCount: { increment: 1 } },
    })

    // ==================== GROW 阶段检测与自动切换 ====================
    // 获取更新后的完整消息历史
    const allMessages = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
      },
    })

    // 转换为阶段检测所需格式
    const messagesForDetection = allMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // 检测是否需要切换阶段
    const detectedPhase = detectGROWPhase(
      messagesForDetection,
      currentPhase
    )

    // 如果检测到阶段变化，更新数据库
    if (detectedPhase !== currentPhase) {
      await prisma.session.update({
        where: { id: session.id },
        data: { currentPhase: detectedPhase },
      })

      console.log(
        `[GROW阶段切换] Session ${session.id}: ${getPhaseName(currentPhase)} → ${getPhaseName(detectedPhase)}`
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: fullResponse,
        phase: detectedPhase
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: '对话失败: ' + (error as Error).message }),
      { status: 500 }
    )
  }
}
