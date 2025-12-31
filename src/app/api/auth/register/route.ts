import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

// 密码哈希函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成简单的 token（实际生产环境建议使用 JWT）
function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, activationCode } = body;

    // 验证必填字段
    if (!username || !password || !activationCode) {
      return NextResponse.json(
        { error: '用户名、密码和激活码都是必填项' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (username.length < 3) {
      return NextResponse.json(
        { error: '用户名至少需要3个字符' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 验证激活码
    const codeRecord = await prisma.activationCode.findUnique({
      where: { code: activationCode },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: '激活码不存在' },
        { status: 400 }
      );
    }

    if (codeRecord.isUsed) {
      return NextResponse.json(
        { error: '激活码已被使用' },
        { status: 400 }
      );
    }

    // 检查激活码是否过期
    if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
      return NextResponse.json(
        { error: '激活码已过期' },
        { status: 400 }
      );
    }

    // 在事务中创建用户并标记激活码为已使用
    const user = await prisma.$transaction(async (tx) => {
      // 创建用户
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashPassword(password),
          activationCodeId: codeRecord.id,
          onboardingCompleted: false, // 明确设置为 false，确保新用户需要完成引导
        },
      });

      // 标记激活码为已使用
      await tx.activationCode.update({
        where: { id: codeRecord.id },
        data: {
          isUsed: true,
          usedBy: newUser.id,
          usedAt: new Date(),
        },
      });

      return newUser;
    });

    // 生成 token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        onboardingCompleted: user.onboardingCompleted, // 返回 onboarding 状态
      },
      token,
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

