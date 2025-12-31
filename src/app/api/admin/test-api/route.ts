import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 简单的管理员验证
async function verifyAdmin(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user?.isAdmin || false;
}

// POST - 测试 DeepSeek API 连接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUsername, apiKey } = body;

    if (!adminUsername || !(await verifyAdmin(adminUsername))) {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key 不能为空' },
        { status: 400 }
      );
    }

    // 测试 API 调用
    console.log('Testing DeepSeek API connection...');
    
    const testResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '你好，这是一个测试消息。请简短回复。',
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    const responseData = await testResponse.json();

    if (!testResponse.ok) {
      console.error('DeepSeek API 测试失败:', responseData);
      
      // 处理不同的错误类型
      if (testResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'API Key 无效或已过期',
          details: responseData.error?.message || '认证失败',
        });
      } else if (testResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'API 调用频率超限',
          details: '请稍后再试或检查账户配额',
        });
      } else if (testResponse.status === 402) {
        return NextResponse.json({
          success: false,
          error: 'API 账户余额不足',
          details: '请充值后再试',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'API 调用失败',
          details: responseData.error?.message || '未知错误',
        });
      }
    }

    // 测试成功
    console.log('DeepSeek API 测试成功');
    
    return NextResponse.json({
      success: true,
      message: 'API 连接测试成功！',
      details: {
        model: responseData.model,
        response: responseData.choices?.[0]?.message?.content || '收到回复',
        usage: responseData.usage,
      },
    });

  } catch (error: any) {
    console.error('测试 API 连接错误:', error);
    
    // 处理网络错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: '网络连接失败',
        details: '无法连接到 DeepSeek API 服务器，请检查网络连接',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '测试失败',
      details: error.message || '未知错误',
    });
  }
}

