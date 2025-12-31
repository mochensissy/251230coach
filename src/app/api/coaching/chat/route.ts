import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  DeepseekClient,
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

    // 从数据库获取 DeepSeek API Key 配置
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: 'deepseek_api_key' },
    });

    const deepseekApiKey = apiKeySetting?.value || process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: 'DeepSeek API 未配置，请联系管理员' }),
        { status: 503 }
      )
    }

    // 使用配置的 API Key 创建客户端
    const deepseekClient = new DeepseekClient(deepseekApiKey);
      
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
    const response = await deepseekClient.chat({
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
