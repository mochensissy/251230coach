const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function resetPassword() {
  try {
    console.log('🔧 开始重置用户密码...\n');

    // 查找用户
    const username = 'cliusisi';
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.error(`❌ 用户 "${username}" 不存在`);
      return;
    }

    console.log(`✅ 找到用户: ${username}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - 邮箱: ${user.email || '未设置'}`);
    console.log(`   - 是否管理员: ${user.isAdmin ? '是' : '否'}`);
    console.log(`   - 引导完成: ${user.onboardingCompleted ? '是' : '否'}\n`);

    // 设置新密码
    const newPassword = 'cliusisi123'; // 默认密码
    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
      },
    });

    console.log('✅ 密码重置成功！\n');
    console.log('📋 登录信息:');
    console.log(`   用户名: ${username}`);
    console.log(`   密码: ${newPassword}`);
    console.log('\n💡 建议用户登录后立即修改密码\n');

  } catch (error) {
    console.error('❌ 重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();

