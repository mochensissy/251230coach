'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore, useUserStore } from '@/lib/store'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const STEPS = [
  {
    title: '欢迎来到教练伙伴',
    description: '我在这里,通过专业的教练式提问,帮助你厘清思路、激发潜能。\n为了在对话中更好地支持你,我需要花1-2分钟了解一下你的基本情况。\n所有信息仅你可见,请放心分享。',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { currentStep, data, setStep, updateData } = useOnboardingStore()
  const { setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 检查用户是否已登录
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      // 未登录，跳转到登录页
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    // 如果已完成 onboarding，跳转到 dashboard
    if (user.onboardingCompleted) {
      router.push('/dashboard')
      return
    }

    // 新用户：重置 onboarding 状态，从第一步开始
    setStep(0)
    updateData('username', user.username)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  const handleNext = () => {
    setStep(currentStep + 1)
  }

  const handlePrev = () => {
    setStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    // 验证必填字段
    if (!data.username) {
      setError('请输入用户名')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '保存失败')
      }

      // 保存用户信息
      setUser(result.user.username, result.user.id)

      // 跳转到仪表盘
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            步骤 {currentStep + 1}/5
          </p>
        </div>

        {/* 步骤 0: 欢迎 */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {STEPS[0].title}
            </h1>
            <p className="text-gray-600 whitespace-pre-line">
              {STEPS[0].description}
            </p>
            <button
              onClick={handleNext}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              开始了解
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 步骤 1: 角色与背景 (1) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                你的基本信息
              </h2>
              <p className="text-gray-600">让我们先了解一下你</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名 *
                </label>
                <input
                  type="text"
                  value={data.username || ''}
                  onChange={(e) => updateData('username', e.target.value)}
                  placeholder="请输入你的用户名"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={data.email || ''}
                  onChange={(e) => updateData('email', e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你在团队中的角色是：
                </label>
                <select
                  value={data.role || ''}
                  onChange={(e) => updateData('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  <option value="团队负责人/管理者">团队负责人/管理者</option>
                  <option value="核心骨干/资深专家">核心骨干/资深专家</option>
                  <option value="团队成员/执行者">团队成员/执行者</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                上一步
              </button>
              <button
                onClick={handleNext}
                disabled={!data.username}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 2: 业务线 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                你所在的业务条线是：
              </h2>
            </div>

            <div className="space-y-3">
              {['技术/研发', '产品/运营', '市场/销售', '职能/支持', '其他'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    updateData('businessLine', option)
                    handleNext()
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary-500 hover:bg-primary-50 ${
                    data.businessLine === option
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrev}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              上一步
            </button>
          </div>
        )}

        {/* 步骤 3: 工作风格 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                你如何描述自己日常的工作风格？
              </h2>
              <p className="text-gray-600">
                这有助于我用你更习惯的方式和你沟通
              </p>
            </div>

            <div className="space-y-3">
              {[
                '数据驱动,逻辑严谨',
                '关怀他人,团队共赢',
                '目标导向,执行力强',
                '创新思辨,乐于探索',
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    updateData('workStyle', option)
                    handleNext()
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary-500 hover:bg-primary-50 ${
                    data.workStyle === option
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrev}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              上一步
            </button>
          </div>
        )}

        {/* 步骤 4: 目标与挑战 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                最后两个问题
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你目前最关注的'发展目标'是什么？
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  例如：提升领导力、学习新技能等
                </p>
                <textarea
                  value={data.developmentGoal || ''}
                  onChange={(e) => updateData('developmentGoal', e.target.value)}
                  placeholder="请输入..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你当前面临的最大'工作挑战'是什么？
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  例如：项目延期、跨部门沟通不畅等
                </p>
                <textarea
                  value={data.workChallenge || ''}
                  onChange={(e) => updateData('workChallenge', e.target.value)}
                  placeholder="请输入..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '保存中...' : '完成'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
