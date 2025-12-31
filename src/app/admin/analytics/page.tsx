'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BasicStats {
  coreMetrics: {
    totalUsers: number;
    activeUsersWeek: number;
    activeUsersMonth: number;
    totalSessions: number;
    completedSessions: number;
    totalMessages: number;
    totalReports: number;
    avgMessageCount: number;
    completionRate: number;
    userGrowthRate: number;
    sessionGrowthRate: number;
  };
  distributions: {
    scenario: Array<{ name: string; value: number; percentage: string }>;
    role: Array<{ name: string; value: number; percentage: string }>;
    businessLine: Array<{ name: string; value: number; percentage: string }>;
    growPhase: Array<{ name: string; value: number; percentage: string }>;
  };
  conversationDepth: {
    shallow: { label: string; value: number; percentage: string };
    medium: { label: string; value: number; percentage: string };
    deep: { label: string; value: number; percentage: string };
  };
  activityLevels: {
    high: { label: string; value: number; percentage: string };
    medium: { label: string; value: number; percentage: string };
    low: { label: string; value: number; percentage: string };
  };
  trends: Array<{ date: string; count: number }>;
}

interface AIInsights {
  keywords: Array<{ keyword: string; frequency: number; category: string }>;
  clusters: Array<{ name: string; description: string; examples: string[]; percentage: number }>;
  sentiment: { overall: string; score: number; keywords: string[]; details: string };
  trends: Array<{ topic: string; trend: string; insight: string }>;
  summary: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsCached, setInsightsCached] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 从 localStorage 读取用户信息（与管理员主页保持一致）
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

    setUsername(user.username);
    fetchBasicStats(user.username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  const fetchBasicStats = async (adminUsername: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics/basic', {
        headers: {
          'x-username': adminUsername,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBasicStats(data.data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取基础统计失败:', err);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      setGeneratingInsights(true);
      setError('');

      const response = await fetch('/api/admin/analytics/insights', {
        method: 'POST',
        headers: {
          'x-username': username,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAIInsights(data.data);
        setInsightsCached(data.cached);
      } else {
        setError(data.error || 'AI分析失败');
      }
    } catch (err) {
      console.error('生成AI洞察失败:', err);
      setError('网络错误');
    } finally {
      setGeneratingInsights(false);
    }
  };

  // 导出为 Markdown
  const exportToMarkdown = () => {
    if (!aiInsights) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    let markdown = `# AI 数据洞察报告\n\n`;
    markdown += `**生成时间**: ${now.toLocaleString('zh-CN')}\n\n`;
    markdown += `---\n\n`;
    
    // 核心总结
    markdown += `## 📝 核心总结\n\n`;
    markdown += `${aiInsights.summary}\n\n`;
    markdown += `---\n\n`;
    
    // 关键词
    markdown += `## 🔑 热门关键词\n\n`;
    aiInsights.keywords.forEach((kw, index) => {
      markdown += `${index + 1}. **${kw.keyword}** (频次: ${kw.frequency}, 类别: ${kw.category || '未分类'})\n`;
    });
    markdown += `\n---\n\n`;
    
    // 主题聚类
    markdown += `## 🎯 主题聚类\n\n`;
    aiInsights.clusters.forEach((cluster, index) => {
      markdown += `### 聚类 ${index + 1}: ${cluster.name} (${cluster.percentage}%)\n\n`;
      markdown += `**描述**: ${cluster.description}\n\n`;
      if (cluster.examples && cluster.examples.length > 0) {
        markdown += `**示例**:\n`;
        cluster.examples.forEach(ex => {
          markdown += `- ${ex}\n`;
        });
      }
      markdown += `\n`;
    });
    markdown += `---\n\n`;
    
    // 情感分析
    markdown += `## 😊 情感分析\n\n`;
    const sentimentText = aiInsights.sentiment.overall === 'positive' ? '积极' : 
                         aiInsights.sentiment.overall === 'negative' ? '消极' : '中性';
    markdown += `**整体情感**: ${sentimentText}\n\n`;
    markdown += `**评分**: ${aiInsights.sentiment.score.toFixed(2)}\n\n`;
    markdown += `**详情**: ${aiInsights.sentiment.details}\n\n`;
    if (aiInsights.sentiment.keywords && aiInsights.sentiment.keywords.length > 0) {
      markdown += `**关键情感词**: ${aiInsights.sentiment.keywords.join('、')}\n\n`;
    }
    markdown += `---\n\n`;
    
    // 趋势分析
    markdown += `## 📊 趋势分析\n\n`;
    aiInsights.trends.forEach((trend, index) => {
      const trendIcon = trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️';
      markdown += `${index + 1}. ${trendIcon} **${trend.topic}**\n`;
      markdown += `   - ${trend.insight}\n\n`;
    });
    
    markdown += `---\n\n`;
    markdown += `*本报告由教练伙伴智能助手自动生成*\n`;
    
    // 下载文件
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI洞察报告_${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出为 JSON
  const exportToJSON = () => {
    if (!aiInsights || !basicStats) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const exportData = {
      metadata: {
        title: 'AI 数据洞察报告',
        generatedAt: now.toISOString(),
        generatedBy: username,
      },
      basicStats: {
        coreMetrics: basicStats.coreMetrics,
        distributions: basicStats.distributions,
      },
      aiInsights: aiInsights,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI洞察报告_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (!basicStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || '加载失败'}</p>
        </div>
      </div>
    );
  }

  const { coreMetrics, distributions, conversationDepth, activityLevels, trends } = basicStats;

  // 准备图表数据
  const conversationDepthData = [
    { name: conversationDepth.shallow.label, value: conversationDepth.shallow.value },
    { name: conversationDepth.medium.label, value: conversationDepth.medium.value },
    { name: conversationDepth.deep.label, value: conversationDepth.deep.value },
  ];

  const activityLevelsData = [
    { name: activityLevels.high.label, value: activityLevels.high.value },
    { name: activityLevels.medium.label, value: activityLevels.medium.value },
    { name: activityLevels.low.label, value: activityLevels.low.value },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页头 */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 数据分析后台</h1>
            <p className="text-gray-600">实时数据洞察与AI智能分析</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            ← 返回管理后台
          </button>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="总用户数"
            value={coreMetrics.totalUsers}
            change={coreMetrics.userGrowthRate}
            icon="👥"
          />
          <MetricCard
            title="活跃用户（周）"
            value={coreMetrics.activeUsersWeek}
            percentage={((coreMetrics.activeUsersWeek / coreMetrics.totalUsers) * 100).toFixed(0)}
            icon="🔥"
          />
          <MetricCard
            title="总对话数"
            value={coreMetrics.totalSessions}
            change={coreMetrics.sessionGrowthRate}
            icon="💬"
          />
          <MetricCard
            title="完成率"
            value={`${coreMetrics.completionRate}%`}
            subtitle={`${coreMetrics.completedSessions}/${coreMetrics.totalSessions}`}
            icon="✅"
          />
        </div>

        {/* 趋势图表 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 对话趋势（最近30天）</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="对话数" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 分布图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 场景分布 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 场景分布</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributions.scenario}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributions.scenario.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 角色分布 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👤 角色分布</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distributions.role}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 对话深度 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💡 对话深度分析</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={conversationDepthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conversationDepthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 用户活跃度 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 用户活跃度</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityLevelsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI深度洞察区域 */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">🤖 AI深度洞察</h2>
              <p className="text-sm text-gray-600">
                {insightsCached ? '✅ 使用缓存结果（24小时内有效）' : '点击按钮生成AI分析（会调用API）'}
              </p>
            </div>
            <div className="flex gap-3">
              {aiInsights && (
                <>
                  <button
                    onClick={exportToMarkdown}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                    title="导出为 Markdown"
                  >
                    📄 导出 MD
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                    title="导出为 JSON"
                  >
                    📊 导出 JSON
                  </button>
                </>
              )}
              <button
                onClick={generateAIInsights}
                disabled={generatingInsights}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingInsights ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <span>🔮</span>
                    生成AI洞察
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {aiInsights && (
            <div className="space-y-6 mt-6">
              {/* 总结 */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">📝 核心总结</h3>
                <p className="text-gray-700">{aiInsights.summary}</p>
              </div>

              {/* 关键词 */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🔑 热门关键词</h3>
                <div className="flex flex-wrap gap-2">
                  {aiInsights.keywords.map((kw, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      style={{ fontSize: `${Math.max(14, Math.min(24, kw.frequency * 2))}px` }}
                    >
                      {kw.keyword} ({kw.frequency})
                    </span>
                  ))}
                </div>
              </div>

              {/* 主题聚类 */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🎯 主题聚类</h3>
                <div className="space-y-3">
                  {aiInsights.clusters.map((cluster, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-gray-900">
                        {cluster.name} ({cluster.percentage}%)
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{cluster.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.examples?.map((ex, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 情感分析 */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">😊 情感分析</h3>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl">
                    {aiInsights.sentiment.overall === 'positive' ? '😊' : 
                     aiInsights.sentiment.overall === 'negative' ? '😟' : '😐'}
                  </span>
                  <div>
                    <p className="font-medium">
                      整体情感: {aiInsights.sentiment.overall === 'positive' ? '积极' : 
                                 aiInsights.sentiment.overall === 'negative' ? '消极' : '中性'}
                    </p>
                    <p className="text-sm text-gray-600">评分: {aiInsights.sentiment.score.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{aiInsights.sentiment.details}</p>
              </div>

              {/* 趋势分析 */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📊 趋势分析</h3>
                <div className="space-y-2">
                  {aiInsights.trends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-xl">
                        {trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{trend.topic}</p>
                        <p className="text-sm text-gray-600">{trend.insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  change,
  percentage,
  subtitle,
  icon,
}: {
  title: string;
  value: number | string;
  change?: number;
  percentage?: string;
  subtitle?: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {percentage && <p className="text-sm text-blue-600">占比: {percentage}%</p>}
      {change !== undefined && (
        <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% 环比
        </p>
      )}
    </div>
  );
}

