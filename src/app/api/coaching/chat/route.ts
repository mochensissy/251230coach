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

    // 检查是否是第一条消息（用于统计）
    const isFirstMessage = session.messages.length === 0

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

    // 如果是第一条消息，记录 session_start 事件用于统计
    // 这样可以避免误点击造成的统计偏差
    if (isFirstMessage) {
      await prisma.analyticsLog.create({
        data: {
          eventType: 'session_start',
          scenario: session.scenario,
          phase: session.currentPhase,
          metadata: JSON.stringify({
            roleType: session.user.role,
            businessLine: session.user.businessLine,
          }),
        },
      })
      console.log(`[Analytics] 记录首次对话: Session ${session.id}, Scenario: ${session.scenario}`)
    }

    // 构建用户画像字符串
    // 包含历史信息作为背景，但要明确区分"历史背景"和"当前主题"
    const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}

【用户历史背景】（作为参考，非当前讨论重点）
- 曾关注的发展目标：${session.user.developmentGoal || '未记录'}
- 曾提到的工作挑战：${session.user.workChallenge || '未记录'}

⚠️ 重要提示：以上是用户的历史背景信息，可以作为了解用户的参考。但请务必以当前对话历史中的内容为主，不要混淆历史背景和当前讨论的主题。你可以在适当时候融合历史经验来帮助用户，但要清楚区分。
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

    // 调用 Deepseek API（流式响应）
    const response = await deepseekClient.chatStream({
      model: 'deepseek-chat',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    })

    // 创建流式响应
    const encoder = new TextEncoder()
    let fullResponse = ''
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          
          if (!reader) {
            throw new Error('无法获取响应流')
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content || ''
                  
                  if (content) {
                    fullResponse += content
                    // 发送给前端
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  console.error('解析流式数据失败:', e)
                }
              }
            }
          }

          // 流式传输完成，保存完整响应到数据库
          if (fullResponse) {
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

            // GROW 阶段检测与自动切换
            const allMessages = await prisma.message.findMany({
              where: { sessionId: session.id },
              orderBy: { createdAt: 'asc' },
              select: {
                role: true,
                content: true,
              },
            })

            const messagesForDetection = allMessages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }))

            const detectedPhase = detectGROWPhase(
              messagesForDetection,
              currentPhase
            )

            if (detectedPhase !== currentPhase) {
              await prisma.session.update({
                where: { id: session.id },
                data: { currentPhase: detectedPhase },
              })

              console.log(
                `[GROW阶段切换] Session ${session.id}: ${getPhaseName(currentPhase)} → ${getPhaseName(detectedPhase)}`
              )
            }
          }

          // 发送完成信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('流式响应错误:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

    // 注意：GROW阶段检测已移到流式响应完成后在stream中处理
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: '对话失败: ' + (error as Error).message }),
      { status: 500 }
    )
  }
}
