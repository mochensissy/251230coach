# Deepseek API 配置指南

## 快速解决方案

您需要配置 Deepseek API 密钥。以下是详细的配置步骤：

### 步骤1: 获取 Deepseek API 密钥

1. **访问 Deepseek 官网**: https://platform.deepseek.com
2. **注册/登录账户**
3. **进入 API 管理页面**
4. **创建新的 API Key**
5. **复制您的 API Key**

### 步骤2: 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# Deepseek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATABASE_URL="file:./prisma/dev.db"

# 如果您有其他API密钥，也可以一并配置
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**重要**: 替换 `your_deepseek_api_key_here` 为您的实际 API 密钥

### 步骤3: 重启开发服务器

```bash
# 停止现有服务器
pkill -f "next dev"

# 重启服务器
DATABASE_URL="file:./prisma/dev.db" npm run dev
```

### 步骤4: 测试 API 连接

访问诊断页面确认配置：
- http://localhost:3000/api/diagnostic

## API 密钥获取步骤详解

### 详细说明

1. **Deepseek 平台注册**
   - 访问 https://platform.deepseek.com
   - 使用手机号或邮箱注册
   - 完成身份验证

2. **API 管理**
   - 登录后进入控制台
   - 点击 "API Keys" 或 "密钥管理"
   - 点击 "创建新密钥"

3. **密钥设置**
   - 为密钥命名（如：coaching-partner）
   - 选择权限（通常默认即可）
   - 点击创建

4. **复制密钥**
   - 生成后立即复制密钥
   - 密钥只会显示一次，请妥善保存

## 成本说明

**Deepseek 优势**:
- 💰 价格低廉（比 GPT-4 便宜约 90%）
- 🚀 响应速度快
- 🇨🇳 中文优化
- 📊 按使用量计费

**典型成本**:
- 1千个 token ≈ $0.002
- 一次对话（1000 tokens）≈ ¥0.014

## 故障排除

### 常见问题

1. **"API 密钥未配置"错误**
   - 检查 `.env.local` 文件是否存在
   - 确认变量名正确：`DEEPSEEK_API_KEY`
   - 重启开发服务器

2. **"failed to fetch"错误**
   - 检查网络连接
   - 确认 API 密钥有效
   - 检查 Deepseek 服务状态

3. **"401 Unauthorized"错误**
   - API 密钥无效或已过期
   - 重新生成新的 API 密钥

### 验证配置

运行以下命令测试 API 连接：

```bash
curl -X POST https://api.deepseek.com/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

## 临时测试方案

如果您暂时无法获取 API 密钥，我可以创建一个模拟响应版本用于测试界面功能。

---

**配置完成后，您的教练伙伴系统将使用 Deepseek AI 提供专业的 GROW 模型教练对话服务！**
