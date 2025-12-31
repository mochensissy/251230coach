'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Key, Settings, LogOut, BarChart3, Users, MessageSquare } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalActivationCodes: number;
  usedActivationCodes: number;
  unusedActivationCodes: number;
}

interface RecentUser {
  id: number;
  username: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

interface RecentSession {
  id: number;
  scenario: string;
  status: string;
  startedAt: string;
  user: {
    username: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 验证管理员身份
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.isAdmin) {
      router.push('/dashboard');
      return;
    }

    setAdminUsername(user.username);
    fetchDashboardData(user.username);
  }, [router]);

  const fetchDashboardData = async (username: string) => {
    try {
      const response = await fetch(`/api/admin/dashboard?admin=${username}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentSessions(data.recentSessions);
      }
    } catch (error) {
      console.error('获取看板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-800">管理员后台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <User className="w-4 h-4 inline mr-1" />
                {adminUsername}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总用户数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总会话数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalSessions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总激活码</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalActivationCodes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已使用</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.usedActivationCodes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未使用</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.unusedActivationCodes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 快捷操作按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/analytics"
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 border-2 border-purple-200 hover:shadow-md transition group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">📊 数据分析</h3>
                <p className="text-sm text-gray-600">实时数据与AI洞察</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/activation-codes"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
                <Key className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">激活码管理</h3>
                <p className="text-sm text-gray-600">生成、查看和管理激活码</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">API 配置</h3>
                <p className="text-sm text-gray-600">配置 DeepSeek API Key</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 最近注册用户和会话 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近注册用户 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近注册用户</h3>
            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.onboardingCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {user.onboardingCompleted ? '已完成引导' : '未完成引导'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>

          {/* 最近会话 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近会话</h3>
            <div className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.user.username}</p>
                      <p className="text-xs text-gray-500">
                        {session.scenario === 'work_problem' ? '工作难题' : '职业发展'} •{' '}
                        {new Date(session.startedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {session.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

