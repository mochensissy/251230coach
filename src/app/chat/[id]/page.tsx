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
    if (!username) {
      router.push('/onboarding')
      return
    }
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

        // 如果是新会话，显示默认开场白（不调用 API）
        if (historyMessages.length === 0) {
          console.log('显示默认开场白...')
          setMessages([{
            id: Date.now(),
            role: 'assistant',
            content: `你好！我是你的 AI 教练伙伴 🤝

我看到你在用户画像中提到的工作挑战，很高兴能陪伴你一起探索和思考。

作为教练，我不会直接给你答案，而是通过提问帮助你自己找到解决方案。

请告诉我，你现在最想聊什么话题？或者从你的工作挑战开始？`,
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
    
    setMessages((prev) => [...prev, tempUserMessage])

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

      const data = await response.json()
      
      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Unknown error')
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
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
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
    </div>
  )
}
