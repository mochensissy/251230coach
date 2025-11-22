'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 简化的参数处理逻辑
  useEffect(() => {
    // 检查用户登录状态
    if (!username) {
      router.push('/onboarding')
      return
    }

    // 从多个可能的位置获取sessionId
    let detectedSessionId = ''
    
    // 方法1: 从params对象获取
    if (params && typeof params === 'object' && params !== null && 'id' in params) {
      detectedSessionId = params.id as string
    }
    
    // 方法2: 从URL路径获取
    if (!detectedSessionId) {
      const pathSegments = window.location.pathname.split('/')
      const idFromPath = pathSegments[pathSegments.length - 1]
      if (idFromPath && idFromPath !== 'chat' && /^\d+$/.test(idFromPath)) {
        detectedSessionId = idFromPath
      }
    }
    
    // 方法3: 从URL搜索参数获取
    if (!detectedSessionId) {
      const urlParams = new URLSearchParams(window.location.search)
      const idFromQuery = urlParams.get('id')
      if (idFromQuery && /^\d+$/.test(idFromQuery)) {
        detectedSessionId = idFromQuery
      }
    }
    
    // 设置sessionId并开始获取数据
    if (detectedSessionId) {
      console.log('获取到sessionId:', detectedSessionId)
      setSessionId(detectedSessionId)
    }
  }, [username, params, router])

  // 当sessionId变化时，获取会话数据
  useEffect(() => {
    if (!sessionId) return
    
    console.log('开始获取会话数据，sessionId:', sessionId)
    fetchSession()
  }, [sessionId, fetchSession])

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    
    console.log('fetchSession 被调用，sessionId:', sessionId)
    setFetchingSession(true)
    setError(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch session')
      }

      const data = await response.json()

      if (data.success && data.session) {
        // 加载历史消息
        const historyMessages = data.session.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }))
        setMessages(historyMessages)

        // 如果是新会话（没有消息），触发开场白
        if (historyMessages.length === 0) {
          await generateWelcomeMessage(data.session.scenario)
        }
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setError((error as Error).message || '加载会话失败，请刷新重试')
    } finally {
      setFetchingSession(false)
    }
  }, [sessionId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 生成开场白
  const generateWelcomeMessage = async (scenario: string) => {
    setLoading(true)

    try {
      // 添加一个空的 AI 消息占位符
      const tempAssistantMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      }
      setMessages([tempAssistantMessage])

      const response = await fetch('/api/coaching/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: `[系统指令：这是新对话的开始，请根据场景"${scenario === 'work_problem' ? '工作难题' : '职业发展'}"生成一个热情、专业的开场白。开场白应该：1. 简短问候并介绍你的角色 2. 提供3个引导性问题选项供用户选择，每个问题前加序号。请直接开始，不要重复系统指令。]`,
          username,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate welcome message')
      }

      // 处理普通JSON响应
      const data = await response.json()
      
      if (data.success && data.message) {
        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
        }])
      } else {
        throw new Error(data.error || 'Failed to get welcome message')
      }
    } catch (error) {
      console.error('Failed to generate welcome message:', error)
      // 如果 API 调用失败，使用本地预设的开场白
      const fallbackMessage = scenario === 'work_problem'
        ? `你好！我是你的 AI 教练伙伴。很高兴能够陪伴你一起探索。

作为教练，我不会直接给你建议，而是通过提问帮助你自己找到答案。这样的洞察往往更加深刻和持久。

在开始之前，请选择一个你想探索的方向：

1. 我遇到了一个具体的工作挑战，想要理清思路
2. 我和某个同事/上级的关系让我感到困扰
3. 我有一个重要决策需要做，但还在犹豫

你可以选择上面的选项，或者直接告诉我你想聊什么。`
        : `你好！我是你的 AI 教练伙伴。很高兴能够陪伴你探索职业发展的方向。

作为教练，我会通过提问帮助你更清晰地认识自己、发现可能性。

在开始之前，请选择一个你想探索的方向：

1. 我想思考未来1-3年的职业规划
2. 我正在考虑是否要转换职业方向
3. 我想提升某方面的能力，但不确定如何开始

你可以选择上面的选项，或者直接告诉我你想聊什么。`

      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: fallbackMessage,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // 添加用户消息
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

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // 处理普通JSON响应（不是流式）
      const data = await response.json()
      
      if (data.success) {
        // 更新AI消息内容
        tempAssistantMessage.content = data.message
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.id === tempAssistantMessage.id) {
            lastMessage.content = data.message
          }
          return newMessages
        })

        // 如果有阶段变化，可以在这里处理
        if (data.phase) {
          console.log('新阶段:', data.phase)
          // 可以添加阶段变化的UI提示
        }
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // 移除空的 AI 消息占位符（如果存在）
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg?.role === 'assistant' && lastMsg.content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
      // 显示更友好的错误消息
      const errorMessage = (error as Error).message || '网络错误'
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `抱歉，发生了错误：${errorMessage}\n\n请检查网络连接后重试，或者刷新页面。`,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const [reportError, setReportError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
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

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 加载状态 */}
          {fetchingSession && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">正在加载对话历史...</p>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && !fetchingSession && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => fetchSession()}
                  className="flex-shrink-0 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {!fetchingSession && messages.length === 0 && !error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                准备好开始了吗？
              </h2>
              <p className="text-gray-600">
                我会通过开放式的问题引导你思考,帮助你自主探索解决方案
              </p>
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

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入你的回复..."
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
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
