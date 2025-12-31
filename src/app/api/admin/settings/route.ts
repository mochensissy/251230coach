import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 简单的管理员验证
async function verifyAdmin(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user?.isAdmin || false;
}

// GET - 获取 API 配置
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

    // 获取 DeepSeek API Key 配置
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: 'deepseek_api_key' },
    });

    return NextResponse.json({
      deepseekApiKey: apiKeySetting?.value || '',
      updatedAt: apiKeySetting?.updatedAt,
    });
  } catch (error) {
    console.error('获取 API 配置错误:', error);
    return NextResponse.json(
      { error: '获取 API 配置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新 API 配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUsername, deepseekApiKey } = body;

    if (!adminUsername || !(await verifyAdmin(adminUsername))) {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      );
    }

    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API Key 不能为空' },
        { status: 400 }
      );
    }

    // 更新或创建 API Key 配置
    await prisma.setting.upsert({
      where: { key: 'deepseek_api_key' },
      update: {
        value: deepseekApiKey,
        description: 'DeepSeek API Key for coaching conversations',
      },
      create: {
        key: 'deepseek_api_key',
        value: deepseekApiKey,
        description: 'DeepSeek API Key for coaching conversations',
      },
    });

    // 记录管理员操作日志
    await prisma.adminLog.create({
      data: {
        adminName: adminUsername,
        action: 'update_api_config',
        details: JSON.stringify({
          configKey: 'deepseek_api_key',
          masked: `${deepseekApiKey.substring(0, 8)}...`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API 配置更新成功',
    });
  } catch (error) {
    console.error('更新 API 配置错误:', error);
    return NextResponse.json(
      { error: '更新 API 配置失败' },
      { status: 500 }
    );
  }
}


