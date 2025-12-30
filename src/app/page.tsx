'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 检查本地存储中是否有用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      // 如果是管理员，跳转到管理后台
      if (user.isAdmin) {
        router.push('/admin')
      } else if (user.onboardingCompleted) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } else {
      // 未登录，跳转到登录页
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}
