import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

// 密码哈希函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成简单的 token
function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码都是必填项' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const passwordHash = hashPassword(password);
    if (user.password !== passwordHash) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        onboardingCompleted: user.onboardingCompleted,
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

