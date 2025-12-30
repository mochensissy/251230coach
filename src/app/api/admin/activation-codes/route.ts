import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

// 生成随机激活码
function generateActivationCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// 简单的管理员验证（实际应用应该使用更严格的认证）
async function verifyAdmin(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user?.isAdmin || false;
}

// GET - 获取激活码列表
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

    const codes = await prisma.activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('获取激活码列表错误:', error);
    return NextResponse.json(
      { error: '获取激活码列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建激活码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUsername, count = 1, note, expiresInDays } = body;

    if (!adminUsername || !(await verifyAdmin(adminUsername))) {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      );
    }

    // 计算过期时间
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 批量创建激活码
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = generateActivationCode();
      const activationCode = await prisma.activationCode.create({
        data: {
          code,
          createdBy: adminUsername,
          note,
          expiresAt,
        },
      });
      codes.push(activationCode);
    }

    // 记录管理员操作日志
    await prisma.adminLog.create({
      data: {
        adminName: adminUsername,
        action: 'create_activation_code',
        details: JSON.stringify({
          count,
          note,
          expiresInDays,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `成功生成 ${count} 个激活码`,
      codes,
    });
  } catch (error) {
    console.error('创建激活码错误:', error);
    return NextResponse.json(
      { error: '创建激活码失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除激活码
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminUsername = searchParams.get('admin');
    const codeId = searchParams.get('id');

    if (!adminUsername || !(await verifyAdmin(adminUsername))) {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      );
    }

    if (!codeId) {
      return NextResponse.json(
        { error: '缺少激活码ID' },
        { status: 400 }
      );
    }

    await prisma.activationCode.delete({
      where: { id: parseInt(codeId) },
    });

    // 记录管理员操作日志
    await prisma.adminLog.create({
      data: {
        adminName: adminUsername,
        action: 'delete_activation_code',
        details: JSON.stringify({ codeId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: '激活码删除成功',
    });
  } catch (error) {
    console.error('删除激活码错误:', error);
    return NextResponse.json(
      { error: '删除激活码失败' },
      { status: 500 }
    );
  }
}

