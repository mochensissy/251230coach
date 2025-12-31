import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 简单的管理员验证
async function verifyAdmin(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user?.isAdmin || false;
}

// GET - 获取管理员看板数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminUsername = searchParams.get('admin');

    if (!adminUsername || !(await verifyAdmin(adminUsername))) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    // 统计数据
    const [
      totalUsers,
      totalSessions,
      totalActivationCodes,
      usedActivationCodes,
      recentUsers,
      recentSessions,
    ] = await Promise.all([
      // 总用户数（排除管理员）
      prisma.user.count({
        where: { isAdmin: false },
      }),
      // 总会话数
      prisma.session.count(),
      // 总激活码数
      prisma.activationCode.count(),
      // 已使用激活码数
      prisma.activationCode.count({
        where: { isUsed: true },
      }),
      // 最近注册用户（最近10个）
      prisma.user.findMany({
        where: { isAdmin: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          username: true,
          createdAt: true,
          onboardingCompleted: true,
        },
      }),
      // 最近会话（最近10个）
      prisma.session.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalSessions,
        totalActivationCodes,
        usedActivationCodes,
        unusedActivationCodes: totalActivationCodes - usedActivationCodes,
      },
      recentUsers,
      recentSessions,
    });
  } catch (error) {
    console.error('获取看板数据错误:', error);
    return NextResponse.json(
      { error: '获取看板数据失败' },
      { status: 500 }
    );
  }
}


