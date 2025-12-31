'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { Send, ArrowLeft, FileText } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { username } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [fetchingSession, setFetchingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [rating, setRating] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 使用 React.use() 解包 Promise
  const resolvedParams = use(params)

  // 立即设置sessionId，不等待
  useEffect(() => {
    console.log('获取到参数:', resolvedParams)
    setSessionId(resolvedParams.id)
  }, [])

  useEffect(() => {
    // 确保用户已登录
    console.log('Chat页面检查用户登录状态，username:', username)
    if (!username) {
      console.warn('未找到username，跳转到onboarding')
      router.push('/onboarding')
      return
    }
    console.log('用户已登录，username:', username)
  }, [username, router])

  // 当sessionId变化时立即获取数据
  useEffect(() => {
    if (!sessionId || !username) return

    console.log('开始加载会话:', sessionId)
    fetchSession()
  }, [sessionId, username])

  const fetchSession = async () => {
    console.log('fetchSession 被调用:', sessionId)
    setFetchingSession(true)
    setError(null)

    try {
      console.log('正在请求API:', `/api/sessions/${sessionId}`)
      const response = await fetch(`/api/sessions/${sessionId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('API响应:', data)

      if (data.success && data.session) {
        const historyMessages = data.session.messages || []
        console.log('加载历史消息:', historyMessages.length, '条')
        setMessages(historyMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        })))

        // 如果是新会话，显示开场白（可能包含用户的初始问题）
        if (historyMessages.length === 0) {
          console.log('🟢 Chat: 新会话，检查sessionStorage中的initialQuestion')
          const initialQuestion = sessionStorage.getItem('initialQuestion')
          console.log('🟢 Chat: 读取到的initialQuestion:', initialQuestion)
          
          // 检查这个session的创建时间，只有刚创建的session（5秒内）才使用initialQuestion
          const sessionCreatedAt = new Date(data.session.startedAt).getTime()
          const now = Date.now()
          const timeDiff = now - sessionCreatedAt
          const isNewSession = timeDiff < 5000 // 5秒内创建的session
          
          console.log('🟢 Chat: Session创建时间:', new Date(sessionCreatedAt).toISOString())
          console.log('🟢 Chat: 当前时间:', new Date(now).toISOString())
          console.log('🟢 Chat: 时间差(ms):', timeDiff)
          console.log('🟢 Chat: 是否为新创建的session:', isNewSession)
          
          let welcomeMessage = ''
          
          if (initialQuestion && isNewSession) {
            // 用户在Onboarding中填写了问题，且是刚创建的session，在开场白中引用
            console.log('✅ Chat: 检测到初始问题且是新session，在开场白中引用:', initialQuestion)
            sessionStorage.removeItem('initialQuestion') // 清除，避免重复使用
            console.log('🟢 Chat: 已清除sessionStorage中的initialQuestion')
            
            welcomeMessage = `你好！我是你的 AI 教练伙伴 🤝

我看到你提到：「${initialQuestion}」

很高兴能陪伴你一起探索这个话题。

🔒 **隐私承诺**：我们的对话完全保密，只有你和我知道。你可以放心地分享任何工作中的困惑和挑战，这里是一个安全的空间。

作为教练，我不会直接给你答案，而是通过提问帮助你自己找到解决方案。

那么，关于这个问题，你能具体说说是哪方面让你感到困扰吗？或者从最让你头疼的地方开始？`
          } else {
            // 没有初始问题或不是新session，显示默认开场白
            if (initialQuestion && !isNewSession) {
              console.log('⚠️ Chat: 检测到initialQuestion但不是新session，清除旧数据')
              sessionStorage.removeItem('initialQuestion')
            }
            console.log('⚠️ Chat: 显示默认开场白')
            welcomeMessage = `你好！我是你的 AI 教练伙伴 🤝

很高兴能陪伴你一起探索和思考。

🔒 **隐私承诺**：我们的对话完全保密，只有你和我知道。你可以放心地分享任何工作中的困惑和挑战，这里是一个安全的空间。

作为教练，我不会直接给你答案，而是通过提问帮助你自己找到解决方案。

请告诉我，你现在最想聊什么话题？`
          }
          
          setMessages([{
            id: Date.now(),
            role: 'assistant',
            content: welcomeMessage,
            createdAt: new Date().toISOString(),
          }])
        }
      } else {
        throw new Error('API返回数据格式错误')
      }
    } catch (error) {
      console.error('获取会话失败:', error)
      setError(`加载失败: ${(error as Error).message}`)
    } finally {
      console.log('加载完成')
      setFetchingSession(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    
    // 添加"正在思考"的临时消息
    const thinkingMessageId = Date.now() + 1
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      role: 'assistant',
      content: '...',  // 将通过CSS显示动画
      createdAt: new Date().toISOString(),
    }
    
    setMessages((prev) => [...prev, tempUserMessage, thinkingMessage])

    try {
      const response = await fetch('/api/coaching/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          username,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 读取流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      let assistantContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.done) {
                // 流式传输完成
                console.log('流式响应完成')
                break
              }
              
              if (data.content) {
                assistantContent += data.content
                
                // 添加打字延迟，让显示更自然
                // 每个字符延迟30-50ms，模拟真人打字速度
                await new Promise(resolve => setTimeout(resolve, 30))
                
                // 实时更新消息
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMsg = newMessages[newMessages.length - 1]
                  
                  if (lastMsg && lastMsg.id === thinkingMessageId) {
                    // 更新"正在思考"消息为实际内容
                    lastMsg.content = assistantContent
                  }
                  
                  return newMessages
                })
              }
            } catch (e) {
              console.error('解析流式数据失败:', e, line)
            }
          }
        }
      }

      // 确保最终内容已更新
      if (assistantContent) {
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          
          if (lastMsg && lastMsg.id === thinkingMessageId) {
            lastMsg.content = assistantContent
          }
          
          return newMessages
        })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `抱歉，发生了错误：${(error as Error).message}\n\n请检查网络连接后重试。`,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    setReportError(null)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/report/${data.report.id}`)
      } else {
        setReportError(data.error || '生成报告失败，请稍后重试')
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      setReportError('网络错误，请检查连接后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleEndSession = () => {
    // 检查对话是否真的完成（至少5轮对话）
    if (messages.length < 10) {
      setShowEndDialog(true)
    } else {
      setShowRatingDialog(true)
    }
  }

  const confirmEndSession = async () => {
    setShowEndDialog(false)
    setShowRatingDialog(true)
  }

  const submitRating = async () => {
    try {
      // 保存评分
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          username,
          npsScore: rating,
        }),
      })

      // 更新session状态为completed
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
        }),
      })

      // 跳转回Dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  if (fetchingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">正在加载对话历史...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div className="flex items-center gap-3">
              {reportError && (
                <span className="text-sm text-red-600">{reportError}</span>
              )}
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                结束对话
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating || messages.length < 4}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                {generating ? '生成中...' : '生成总结报告'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => fetchSession()}
                className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
              >
                重试
              </button>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {message.role === 'assistant' && (
                        <Image
                          src="/ai-coach-avatar.jpg"
                          alt="AI Coach"
                          width={40}
                          height={40}
                          className="rounded-full shadow-sm"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      {message.content === '...' ? (
                        // 显示"正在思考"动画
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">正在思考</span>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-primary-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="输入你的回复..."
              className="flex-1 px-6 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 结束对话确认弹窗 */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              确认结束对话？
            </h3>
            <p className="text-gray-600 mb-6">
              我注意到这次对话还比较简短。通常一次完整的教练对话需要更多的探讨和反思。
              <br /><br />
              你确定要现在结束吗？我们可以继续深入探讨，帮助你获得更多洞察。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                继续对话
              </button>
              <button
                onClick={confirmEndSession}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                确认结束
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评分弹窗 */}
      {showRatingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              感谢你的参与！
            </h3>
            <p className="text-gray-600 mb-6">
              这次对话对你有帮助吗？请给我们打个分吧！
            </p>
            
            {/* 五星评分 */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-4xl transition-all hover:scale-110"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingDialog(false)
                  router.push('/dashboard')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                跳过
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
