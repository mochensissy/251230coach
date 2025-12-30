'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Copy, Check } from 'lucide-react';

interface ActivationCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedBy: number | null;
  createdBy: string | null;
  note: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
  users: { username: string }[];
}

export default function ActivationCodesPage() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState('');
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    count: 1,
    note: '',
    expiresInDays: '',
  });
  const [copiedCode, setCopiedCode] = useState('');

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
    fetchCodes(user.username);
  }, [router]);

  const fetchCodes = async (username: string) => {
    try {
      const response = await fetch(`/api/admin/activation-codes?admin=${username}`);
      const data = await response.json();

      if (response.ok) {
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('获取激活码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCodes = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/activation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername,
          count: parseInt(createForm.count.toString()),
          note: createForm.note || undefined,
          expiresInDays: createForm.expiresInDays ? parseInt(createForm.expiresInDays) : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({ count: 1, note: '', expiresInDays: '' });
        fetchCodes(adminUsername);
      }
    } catch (error) {
      console.error('创建激活码失败:', error);
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    if (!confirm('确定要删除这个激活码吗？')) return;

    try {
      const response = await fetch(
        `/api/admin/activation-codes?admin=${adminUsername}&id=${codeId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchCodes(adminUsername);
      }
    } catch (error) {
      console.error('删除激活码失败:', error);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
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
            <h1 className="ml-6 text-xl font-bold text-gray-800">激活码管理</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作按钮 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">激活码列表</h2>
            <p className="text-gray-600 mt-1">共 {codes.length} 个激活码</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            生成激活码
          </button>
        </div>

        {/* 激活码列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  激活码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  备注
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <code className="text-sm font-mono font-medium text-gray-900">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        code.isUsed
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {code.isUsed ? '已使用' : '未使用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.users[0]?.username || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {code.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!code.isUsed && (
                      <button
                        onClick={() => handleDeleteCode(code.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 创建激活码模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">生成激活码</h3>
            <form onSubmit={handleCreateCodes} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成数量
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={createForm.count}
                  onChange={(e) => setCreateForm({ ...createForm, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <input
                  type="text"
                  value={createForm.note}
                  onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="如：销售部门专用"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期（天数，可选）
                </label>
                <input
                  type="number"
                  min="1"
                  value={createForm.expiresInDays}
                  onChange={(e) => setCreateForm({ ...createForm, expiresInDays: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="留空表示永不过期"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  生成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

