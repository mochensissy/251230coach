import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/admin/analytics/basic
 * 获取基础统计数据（免费，实时，无需API调用）
 */
export async function GET(request: NextRequest) {
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

    // 时间范围定义
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. 核心指标
    const [
      totalUsers,
      activeUsersWeek,
      activeUsersMonth,
      totalSessions,
      completedSessions,
      totalMessages,
      totalReports,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 活跃用户（7天）
      prisma.user.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      
      // 活跃用户（30天）
      prisma.user.count({
        where: {
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      
      // 总对话数
      prisma.session.count(),
      
      // 完成的对话数
      prisma.session.count({
        where: { status: 'completed' },
      }),
      
      // 总消息数
      prisma.message.count(),
      
      // 总报告数
      prisma.summaryReport.count(),
    ]);

    // 2. 场景分布
    const scenarioDistribution = await prisma.session.groupBy({
      by: ['scenario'],
      _count: {
        id: true,
      },
    });

    // 3. 角色分布
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        role: { not: null },
      },
    });

    // 4. 业务线分布
    const businessLineDistribution = await prisma.user.groupBy({
      by: ['businessLine'],
      _count: {
        id: true,
      },
      where: {
        businessLine: { not: null },
      },
    });

    // 5. GROW阶段分布
    const growPhaseDistribution = await prisma.session.groupBy({
      by: ['currentPhase'],
      _count: {
        id: true,
      },
      where: {
        currentPhase: { not: null },
      },
    });

    // 6. 对话深度分析（按消息数量分组）
    const allSessions = await prisma.session.findMany({
      select: {
        messageCount: true,
      },
    });

    const conversationDepth = {
      shallow: allSessions.filter(s => s.messageCount < 5).length,
      medium: allSessions.filter(s => s.messageCount >= 5 && s.messageCount <= 10).length,
      deep: allSessions.filter(s => s.messageCount > 10).length,
    };

    // 7. 用户活跃度分层
    const userActivityLevels = await prisma.$queryRaw<Array<{ userId: number; sessionCount: number }>>`
      SELECT userId, COUNT(*) as sessionCount
      FROM sessions
      GROUP BY userId
    `;

    const activityLevels = {
      high: userActivityLevels.filter(u => u.sessionCount > 5).length,
      medium: userActivityLevels.filter(u => u.sessionCount >= 2 && u.sessionCount <= 5).length,
      low: userActivityLevels.filter(u => u.sessionCount === 1).length,
    };

    // 8. 趋势数据（最近30天，按天统计）
    const sessionsLast30Days = await prisma.session.findMany({
      where: {
        startedAt: { gte: thirtyDaysAgo },
      },
      select: {
        startedAt: true,
      },
    });

    // 按天分组
    const dailySessionCounts: { [key: string]: number } = {};
    sessionsLast30Days.forEach(session => {
      const dateKey = session.startedAt.toISOString().split('T')[0];
      dailySessionCounts[dateKey] = (dailySessionCounts[dateKey] || 0) + 1;
    });

    const trendData = Object.entries(dailySessionCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 9. 计算增长率（对比上一周期）
    const [
      sessionsThisMonth,
      sessionsLastMonth,
      usersThisMonth,
      usersLastMonth,
    ] = await Promise.all([
      prisma.session.count({
        where: { startedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.session.count({
        where: {
          startedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    const sessionGrowthRate = sessionsLastMonth > 0
      ? ((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth * 100).toFixed(1)
      : '0.0';

    const userGrowthRate = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : '0.0';

    // 10. 平均指标
    const avgMessageCount = totalSessions > 0
      ? (totalMessages / totalSessions).toFixed(1)
      : '0';

    const completionRate = totalSessions > 0
      ? ((completedSessions / totalSessions) * 100).toFixed(1)
      : '0';

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        // 核心指标
        coreMetrics: {
          totalUsers,
          activeUsersWeek,
          activeUsersMonth,
          totalSessions,
          completedSessions,
          totalMessages,
          totalReports,
          avgMessageCount: parseFloat(avgMessageCount),
          completionRate: parseFloat(completionRate),
          userGrowthRate: parseFloat(userGrowthRate),
          sessionGrowthRate: parseFloat(sessionGrowthRate),
        },
        
        // 分布数据
        distributions: {
          scenario: scenarioDistribution.map(item => ({
            name: item.scenario === 'work_problem' ? '工作难题' : '职业发展',
            value: item._count.id,
            percentage: ((item._count.id / totalSessions) * 100).toFixed(1),
          })),
          role: roleDistribution.map(item => ({
            name: item.role || '未知',
            value: item._count.id,
            percentage: ((item._count.id / totalUsers) * 100).toFixed(1),
          })),
          businessLine: businessLineDistribution.map(item => ({
            name: item.businessLine || '未知',
            value: item._count.id,
            percentage: ((item._count.id / totalUsers) * 100).toFixed(1),
          })),
          growPhase: growPhaseDistribution.map(item => ({
            name: item.currentPhase || '未知',
            value: item._count.id,
            percentage: ((item._count.id / totalSessions) * 100).toFixed(1),
          })),
        },
        
        // 对话深度
        conversationDepth: {
          shallow: {
            label: '浅层对话 (< 5轮)',
            value: conversationDepth.shallow,
            percentage: ((conversationDepth.shallow / totalSessions) * 100).toFixed(1),
          },
          medium: {
            label: '中等深度 (5-10轮)',
            value: conversationDepth.medium,
            percentage: ((conversationDepth.medium / totalSessions) * 100).toFixed(1),
          },
          deep: {
            label: '深度对话 (> 10轮)',
            value: conversationDepth.deep,
            percentage: ((conversationDepth.deep / totalSessions) * 100).toFixed(1),
          },
        },
        
        // 用户活跃度
        activityLevels: {
          high: {
            label: '高活跃 (>5次)',
            value: activityLevels.high,
            percentage: ((activityLevels.high / totalUsers) * 100).toFixed(1),
          },
          medium: {
            label: '中活跃 (2-5次)',
            value: activityLevels.medium,
            percentage: ((activityLevels.medium / totalUsers) * 100).toFixed(1),
          },
          low: {
            label: '低活跃 (1次)',
            value: activityLevels.low,
            percentage: ((activityLevels.low / totalUsers) * 100).toFixed(1),
          },
        },
        
        // 趋势数据
        trends: trendData,
      },
    });
  } catch (error) {
    console.error('获取基础统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取数据失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}


