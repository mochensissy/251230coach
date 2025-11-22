'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore, useSessionStore } from '@/lib/store'
import { MessageCircle, TrendingUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface Session {
  id: number
  scenario: string
  status: string
  startedAt: string
  durationMinutes?: number
  summaryReport?: {
    id: number
    topic: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { username, userId } = useUserStore()
  const { setSession } = useSessionStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) {
      router.push('/onboarding')
      return
    }

    fetchSessions()
  }, [username, router])

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?username=${username}`)
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewSession = async (scenario: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, scenario }),
      })

      const data = await response.json()

      if (data.success) {
        setSession(data.session.id, scenario)
        router.push(`/chat/${data.session.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const getScenarioLabel = (scenario: string) => {
    return scenario === 'work_problem' ? '工作难题' : '职业发展'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">教练伙伴</h1>
            <p className="text-gray-600">你好, {username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎卡片 */}
        <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">准备好开始新的对话了吗？</h2>
          <p className="text-primary-100 mb-6">
            选择一个场景开始你的教练之旅
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => startNewSession('work_problem')}
              className="bg-white text-gray-900 p-6 rounded-xl hover:shadow-xl transition-all text-left group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <MessageCircle className="w-8 h-8 text-primary-600 mb-3" />
                  <h3 className="text-xl font-bold mb-2">工作难题</h3>
                  <p className="text-gray-600 text-sm">
                    在实际工作中遇到挑战,通过教练式提问,探索解决方案
                  </p>
                  <p className="text-primary-600 text-sm mt-3 font-medium group-hover:translate-x-2 transition-transform">
                    开始对话 →
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Image
                    src="/work-problem.jpg"
                    alt="工作难题"
                    width={160}
                    height={160}
                    className="rounded-lg"
                    unoptimized
                  />
                </div>
              </div>
            </button>

            <button
              onClick={() => startNewSession('career_development')}
              className="bg-white text-gray-900 p-6 rounded-xl hover:shadow-xl transition-all text-left group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="text-xl font-bold mb-2">职业发展</h3>
                  <p className="text-gray-600 text-sm">
                    对职业路径有迷茫,一起厘清思路,制定发展计划
                  </p>
                  <p className="text-indigo-600 text-sm mt-3 font-medium group-hover:translate-x-2 transition-transform">
                    开始对话 →
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Image
                    src="/career-development.jpg"
                    alt="职业发展"
                    width={160}
                    height={160}
                    className="rounded-lg"
                    unoptimized
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm mb-1">总对话</p>
            <p className="text-3xl font-bold text-gray-900">{sessions.length} 次</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm mb-1">生成报告</p>
            <p className="text-3xl font-bold text-gray-900">
              {sessions.filter(s => s.summaryReport).length} 份
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-600 text-sm mb-1">最近对话</p>
            <p className="text-3xl font-bold text-gray-900">
              {sessions[0]
                ? Math.ceil(
                    (Date.now() - new Date(sessions[0].startedAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + ' 天前'
                : '-'}
            </p>
          </div>
        </div>

        {/* 最近的对话 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">最近的对话</h3>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">还没有对话记录</p>
              <p className="text-gray-400 text-sm">开始你的第一次教练对话吧</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                  onClick={() => router.push(`/chat/${session.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.scenario === 'work_problem'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {getScenarioLabel(session.scenario)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {session.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.startedAt), 'MM月dd日')}
                    </span>
                  </div>

                  {session.summaryReport && (
                    <p className="text-gray-900 font-medium mb-1">
                      {session.summaryReport.topic}
                    </p>
                  )}

                  {session.durationMinutes && (
                    <p className="text-sm text-gray-500">
                      对话时长: {session.durationMinutes} 分钟
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
