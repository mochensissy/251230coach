'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
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
    fetchSettings(user.username);
  }, [router]);

  const fetchSettings = async (username: string) => {
    try {
      const response = await fetch(`/api/admin/settings?admin=${username}`);
      const data = await response.json();

      if (response.ok) {
        setApiKey(data.deepseekApiKey || '');
      }
    } catch (error) {
      console.error('获取设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername,
          deepseekApiKey: apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'API 配置保存成功！' });
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setSaving(false);
    }
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
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/admin"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回后台
            </Link>
            <h1 className="ml-6 text-xl font-bold text-gray-800">API 配置</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 说明卡片 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">关于 API 配置</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            配置 DeepSeek API Key 后，所有用户的对话都将使用此 API 进行 AI 对话。
            <br />
            如果你还没有 API Key，请访问{' '}
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              DeepSeek 平台
            </a>{' '}
            获取。
          </p>
        </div>

        {/* 消息提示 */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 配置表单 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSave}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  placeholder="sk-..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                API Key 将被安全存储，用于所有用户的 AI 对话
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </form>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">•</span>
              <span>所有注册用户的对话将使用这里配置的 DeepSeek API Key</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">•</span>
              <span>请确保 API Key 有足够的额度，否则用户将无法进行对话</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">•</span>
              <span>更改 API Key 后会立即生效，无需重启应用</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">•</span>
              <span>建议定期检查 API 使用情况，避免超出额度</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

