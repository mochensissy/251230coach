import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DeepseekClient } from '@/lib/deepseek';

export const runtime = 'nodejs';

/**
 * POST /api/admin/analytics/insights
 * 生成AI深度洞察（按需调用，会产生API费用）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const username = request.headers.get('x-username');
    if (!username) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    // 1. 检查缓存（24小时内）
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedInsight = await prisma.analyticsInsight.findFirst({
      where: {
        insightType: 'daily_analysis',
        generatedAt: { gte: twentyFourHoursAgo },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (cachedInsight) {
      console.log('✅ 使用缓存的AI分析结果');
      return NextResponse.json({
        success: true,
        data: JSON.parse(cachedInsight.content),
        cached: true,
        generatedAt: cachedInsight.generatedAt,
      });
    }

    // 2. 获取DeepSeek API Key
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: 'deepseek_api_key' },
    });

    if (!apiKeySetting?.value) {
      return NextResponse.json(
        { success: false, error: '未配置 DeepSeek API Key' },
        { status: 400 }
      );
    }

    const deepseekClient = new DeepseekClient(apiKeySetting.value);

    // 3. 获取最近30天的数据
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [recentSessions, recentMessages] = await Promise.all([
      prisma.session.findMany({
        where: {
          startedAt: { gte: thirtyDaysAgo },
        },
        include: {
          user: {
            select: {
              role: true,
              businessLine: true,
              workChallenge: true,
            },
          },
          summaryReport: {
            select: {
              topic: true,
              insights: true,
            },
          },
        },
        take: 100, // 限制数量，避免数据过大
      }),
      prisma.message.findMany({
        where: {
          role: 'user',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          content: true,
          sessionId: true,
        },
        take: 500, // 限制数量
      }),
    ]);

    if (recentSessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          keywords: [],
          clusters: [],
          sentiment: { overall: 'neutral', details: '暂无足够数据进行分析' },
          trends: [],
          summary: '系统中暂无足够的对话数据进行AI分析。',
        },
        cached: false,
      });
    }

    // 4. 准备分析数据
    const topics = recentSessions
      .map(s => s.summaryReport?.topic || s.user.workChallenge)
      .filter((t): t is string => typeof t === 'string' && t.length > 0)
      .slice(0, 50); // 限制数量

    const userMessages = recentMessages
      .map(m => m.content)
      .filter((c): c is string => typeof c === 'string' && c.length > 0)
      .slice(0, 100); // 限制数量

    console.log(`🤖 开始AI分析: ${topics.length}个主题, ${userMessages.length}条消息`);

    // 5. 并行调用AI分析
    const [keywordsResult, clustersResult, sentimentResult, trendsResult] = await Promise.all([
      // 5.1 关键词提取
      extractKeywords(deepseekClient, topics),
      
      // 5.2 主题聚类
      clusterTopics(deepseekClient, topics),
      
      // 5.3 情感分析
      analyzeSentiment(deepseekClient, userMessages),
      
      // 5.4 趋势分析
      analyzeTrends(deepseekClient, topics),
    ]);

    // 6. 组合结果
    const insights = {
      keywords: keywordsResult,
      clusters: clustersResult,
      sentiment: sentimentResult,
      trends: trendsResult,
      summary: generateSummary(keywordsResult, clustersResult, sentimentResult),
    };

    // 7. 缓存结果
    await prisma.analyticsInsight.create({
      data: {
        insightType: 'daily_analysis',
        content: JSON.stringify(insights),
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 8. 记录管理员操作
    await prisma.adminLog.create({
      data: {
        adminName: username,
        action: 'generate_ai_insights',
        details: JSON.stringify({
          sessionsAnalyzed: recentSessions.length,
          messagesAnalyzed: recentMessages.length,
        }),
      },
    });

    console.log('✅ AI分析完成并已缓存');

    return NextResponse.json({
      success: true,
      data: insights,
      cached: false,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('AI分析失败:', error);
    return NextResponse.json(
      { success: false, error: 'AI分析失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 关键词提取
 */
async function extractKeywords(client: DeepseekClient, topics: string[]): Promise<any[]> {
  try {
    const prompt = `
分析以下对话主题，提取5-10个最核心的关键词：

${topics.slice(0, 30).join('\n')}

要求：
1. 关键词要准确反映核心问题和挑战
2. 使用专业术语
3. 按频次排序
4. 返回 JSON 格式: [{"keyword": "关键词", "frequency": 频次, "category": "类别"}]

只返回JSON，不要其他文字。
`;

    const response = await client.chat({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('关键词提取失败:', data);
      return [];
    }

    const content = data.choices?.[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('关键词提取错误:', error);
    return [];
  }
}

/**
 * 主题聚类
 */
async function clusterTopics(client: DeepseekClient, topics: string[]): Promise<any[]> {
  try {
    const prompt = `
将以下对话主题进行聚类分析：

${topics.slice(0, 30).join('\n')}

要求：
1. 识别3-5个主要聚类
2. 为每个聚类命名
3. 提供聚类描述和代表性问题
4. 返回 JSON 格式: [{"name": "聚类名称", "description": "描述", "examples": ["示例1", "示例2"], "percentage": 25}]

只返回JSON，不要其他文字。
`;

    const response = await client.chat({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('主题聚类失败:', data);
      return [];
    }

    const content = data.choices?.[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('主题聚类错误:', error);
    return [];
  }
}

/**
 * 情感分析
 */
async function analyzeSentiment(client: DeepseekClient, messages: string[]): Promise<any> {
  try {
    const sampleMessages = messages.slice(0, 20).join('\n---\n');
    
    const prompt = `
分析以下用户消息的整体情感倾向：

${sampleMessages}

要求：
1. 判断整体情感：positive（积极）、neutral（中性）、negative（消极）
2. 给出0-1的情感评分
3. 提取关键情感词
4. 返回 JSON 格式: {"overall": "positive/neutral/negative", "score": 0.75, "keywords": ["关键词"], "details": "简短分析"}

只返回JSON，不要其他文字。
`;

    const response = await client.chat({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('情感分析失败:', data);
      return { overall: 'neutral', score: 0.5, keywords: [], details: '分析失败' };
    }

    const content = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('情感分析错误:', error);
    return { overall: 'neutral', score: 0.5, keywords: [], details: '分析失败' };
  }
}

/**
 * 趋势分析
 */
async function analyzeTrends(client: DeepseekClient, topics: string[]): Promise<any[]> {
  try {
    const prompt = `
分析以下对话主题，识别当前的热门趋势和变化：

${topics.slice(0, 30).join('\n')}

要求：
1. 识别3-5个热门趋势
2. 判断趋势方向：up（上升）、down（下降）、stable（稳定）
3. 提供趋势洞察
4. 返回 JSON 格式: [{"topic": "话题", "trend": "up/down/stable", "insight": "洞察"}]

只返回JSON，不要其他文字。
`;

    const response = await client.chat({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 600,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('趋势分析失败:', data);
      return [];
    }

    const content = data.choices?.[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('趋势分析错误:', error);
    return [];
  }
}

/**
 * 生成总结
 */
function generateSummary(keywords: any[], clusters: any[], sentiment: any): string {
  const topKeywords = keywords.slice(0, 3).map(k => k.keyword).join('、');
  const topCluster = clusters[0]?.name || '未知';
  const sentimentText = sentiment.overall === 'positive' ? '积极' : 
                       sentiment.overall === 'negative' ? '消极' : '中性';
  
  return `基于最近30天的数据分析，员工最关注的问题是：${topKeywords}。主要挑战集中在"${topCluster}"领域。整体情感倾向为${sentimentText}。`;
}


