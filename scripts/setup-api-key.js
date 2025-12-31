const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupApiKey() {
  try {
    console.log('🔧 开始配置 DeepSeek API Key...\n');

    // 从 .env.local 读取 API Key
    const envPath = path.join(__dirname, '..', '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ 未找到 .env.local 文件');
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DEEPSEEK_API_KEY=(.+)/);
    
    if (!match) {
      console.error('❌ .env.local 中未找到 DEEPSEEK_API_KEY');
      process.exit(1);
    }

    const apiKey = match[1].trim();
    console.log('📝 从 .env.local 读取到 API Key:', apiKey.substring(0, 10) + '...');
    console.log('');

    // 检查数据库中是否已有配置
    const existingSetting = await prisma.setting.findUnique({
      where: { key: 'deepseek_api_key' }
    });

    if (existingSetting) {
      console.log('📋 数据库中已有配置，正在更新...');
      await prisma.setting.update({
        where: { key: 'deepseek_api_key' },
        data: {
          value: apiKey,
          description: 'DeepSeek API Key for coaching conversations',
          updatedAt: new Date(),
        },
      });
      console.log('✅ API Key 配置已更新\n');
    } else {
      console.log('📋 数据库中无配置，正在创建...');
      await prisma.setting.create({
        data: {
          key: 'deepseek_api_key',
          value: apiKey,
          description: 'DeepSeek API Key for coaching conversations',
        },
      });
      console.log('✅ API Key 配置已创建\n');
    }

    // 记录管理员操作日志
    await prisma.adminLog.create({
      data: {
        adminName: 'system',
        action: 'setup_api_key',
        details: JSON.stringify({
          source: 'auto_setup_script',
          configKey: 'deepseek_api_key',
          masked: `${apiKey.substring(0, 8)}...`,
        }),
      },
    });

    // 验证配置
    console.log('🔍 验证配置...');
    const verifyConfig = await prisma.setting.findUnique({
      where: { key: 'deepseek_api_key' }
    });

    if (verifyConfig && verifyConfig.value === apiKey) {
      console.log('✅ 配置验证成功！\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 DeepSeek API Key 配置完成！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📊 配置详情:');
      console.log('  • 配置键: deepseek_api_key');
      console.log('  • API Key:', apiKey.substring(0, 10) + '...');
      console.log('  • 更新时间:', verifyConfig.updatedAt.toLocaleString('zh-CN'));
      console.log('');
      console.log('✨ 现在系统将优先使用管理员后台配置的 API Key');
      console.log('💡 您可以在管理后台随时修改: http://localhost:3000/admin/settings');
      console.log('');
    } else {
      console.error('❌ 配置验证失败');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 配置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupApiKey();


