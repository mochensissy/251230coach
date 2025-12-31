const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 密码哈希函数（与 login route 保持一致）
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function resetAdmin() {
  try {
    console.log('🔄 开始重置管理员账号...\n');

    // 删除现有的 admin 用户（如果存在）
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('📝 找到现有管理员账号，正在删除...');
      await prisma.user.delete({
        where: { username: 'admin' }
      });
      console.log('✅ 已删除现有管理员账号\n');
    }

    // 创建新的管理员账号
    const adminPassword = 'admin';
    const hashedPassword = hashPassword(adminPassword);

    console.log('🔐 密码哈希信息:');
    console.log('原始密码:', adminPassword);
    console.log('哈希值:', hashedPassword);
    console.log('');

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
        onboardingCompleted: true,
        email: 'admin@coachingpartner.com',
      },
    });

    console.log('✅ 管理员账号创建成功！\n');
    console.log('📋 账号信息:');
    console.log('用户名: admin');
    console.log('密码: admin');
    console.log('ID:', admin.id);
    console.log('是否管理员:', admin.isAdmin);
    console.log('');

    // 同时创建一个测试用户
    const testPassword = 'test';
    const testHashedPassword = hashPassword(testPassword);

    const existingTest = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });

    if (existingTest) {
      await prisma.user.delete({
        where: { username: 'testuser' }
      });
    }

    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: testHashedPassword,
        isAdmin: false,
        onboardingCompleted: true,
        email: 'test@example.com',
        role: '团队负责人/管理者',
        businessLine: '技术/研发',
        workStyle: '数据驱动,逻辑严谨',
        developmentGoal: '提升领导力和团队管理能力',
        workChallenge: '平衡技术工作和管理职责',
      },
    });

    console.log('✅ 测试用户创建成功！\n');
    console.log('📋 测试账号信息:');
    console.log('用户名: testuser');
    console.log('密码: test');
    console.log('ID:', testUser.id);
    console.log('是否管理员:', testUser.isAdmin);
    console.log('');

    // 验证密码哈希
    console.log('🔍 验证密码哈希...');
    const verifyAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    console.log('数据库中的管理员密码哈希:', verifyAdmin.password);
    console.log('匹配结果:', verifyAdmin.password === hashedPassword ? '✅ 匹配' : '❌ 不匹配');
    console.log('');

    console.log('🎉 所有账号重置完成！');
    console.log('');
    console.log('现在你可以使用以下账号登录:');
    console.log('1. 管理员账号: admin / admin');
    console.log('2. 测试账号: testuser / test');

  } catch (error) {
    console.error('❌ 重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();

