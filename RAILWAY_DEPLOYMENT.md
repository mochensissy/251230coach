# Railway 部署指南

本指南将帮助你将"教练伙伴"项目部署到 Railway 平台。

## 📋 前置准备

1. **GitHub 账号**：确保代码已推送到 GitHub 仓库
2. **Railway 账号**：访问 [railway.app](https://railway.app) 注册账号
3. **API Keys**：准备好以下 API Key
   - Claude API Key（从 [Anthropic Console](https://console.anthropic.com/) 获取）
   - 或 DeepSeek API Key（如果使用 DeepSeek）

## 🚀 部署步骤

### 第一步：连接 GitHub 仓库

1. 登录 [Railway Dashboard](https://railway.app/dashboard)
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权 Railway 访问你的 GitHub 账号
5. 选择仓库：`mochensissy/251230coach`

### 第二步：添加 PostgreSQL 数据库

1. 在项目页面，点击 **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 会自动创建数据库并设置 `DATABASE_URL` 环境变量
3. 等待数据库部署完成（通常需要 1-2 分钟）

### 第三步：配置环境变量

在项目的 **Variables** 标签页中，添加以下环境变量：

#### 必需的环境变量

```bash
# 数据库连接（Railway 会自动设置，无需手动添加）
DATABASE_URL=postgresql://... （自动生成）

# AI API Key（二选一）
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
# 或
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

#### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接地址 | 自动生成 |
| `ANTHROPIC_API_KEY` | Claude API Key | `sk-ant-api...` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（可选） | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | 应用访问地址 | `https://xxx.railway.app` |

### 第四步：部署应用

1. Railway 检测到配置后会自动开始部署
2. 部署过程包括：
   - 安装依赖 (`npm install`)
   - 生成 Prisma Client (`prisma generate`)
   - 构建 Next.js 应用 (`npm run build`)
   - 运行数据库迁移 (`prisma migrate deploy`)
   - 启动应用 (`npm start`)

3. 查看部署日志，等待部署完成（通常需要 3-5 分钟）

### 第五步：获取访问地址

1. 部署成功后，在 **"Settings"** → **"Networking"** 中
2. 点击 **"Generate Domain"** 生成公开访问地址
3. 你会得到一个类似 `your-app.up.railway.app` 的域名
4. 将此域名更新到环境变量 `NEXT_PUBLIC_APP_URL` 中
5. Railway 会自动重新部署应用

## ✅ 验证部署

访问生成的域名，你应该能看到：
- ✅ 首页加载成功
- ✅ 用户画像采集页面可访问
- ✅ 可以创建新的教练会话
- ✅ AI 对话功能正常工作

## 🔧 常见问题

### Q1: 部署失败，显示 "Build failed"

**解决方案：**
1. 检查 Railway 构建日志，查看具体错误信息
2. 确保 `package.json` 中的依赖版本正确
3. 确认 Node.js 版本兼容（推荐 18.x 或 20.x）

### Q2: 数据库连接失败

**解决方案：**
1. 确认 PostgreSQL 服务已启动
2. 检查 `DATABASE_URL` 环境变量是否正确设置
3. 查看数据库日志，确认迁移是否成功执行

### Q3: AI 对话不工作

**解决方案：**
1. 检查 `ANTHROPIC_API_KEY` 或 `DEEPSEEK_API_KEY` 是否正确
2. 确认 API Key 有足够的额度
3. 查看应用日志中的 API 错误信息

### Q4: 页面加载但样式错误

**解决方案：**
1. 清除浏览器缓存
2. 检查 `NEXT_PUBLIC_APP_URL` 是否设置正确
3. 确认静态资源构建成功

## 📊 监控和维护

### 查看日志

在 Railway Dashboard 中：
- **Deployments** 标签：查看部署历史
- **Logs** 标签：实时查看应用日志
- **Metrics** 标签：监控资源使用情况

### 更新应用

1. 推送新代码到 GitHub
2. Railway 会自动检测更改并重新部署
3. 或手动在 Railway Dashboard 点击 **"Redeploy"**

### 数据库备份

1. 在 PostgreSQL 服务页面
2. 点击 **"Data"** 标签
3. 使用 Railway 提供的备份功能
4. 或连接到数据库手动导出

## 🌐 绑定自定义域名（可选）

1. 在 Railway 项目的 **"Settings"** → **"Networking"**
2. 点击 **"Custom Domain"**
3. 添加你的域名（如 `coach.example.com`）
4. 在你的 DNS 提供商处添加 CNAME 记录
5. 更新 `NEXT_PUBLIC_APP_URL` 环境变量

## 💰 费用说明

Railway 提供以下计费方案：

- **Hobby Plan**：免费，适合小型项目
  - $5 免费额度/月
  - 512MB RAM
  - 1GB 存储空间

- **Developer Plan**：$5/月起
  - 8GB RAM
  - 100GB 存储空间
  - 无限项目

更多信息请访问：[Railway Pricing](https://railway.app/pricing)

## 📞 技术支持

- **Railway 文档**：https://docs.railway.app
- **Railway Discord**：https://discord.gg/railway
- **项目 Issues**：https://github.com/mochensissy/251230coach/issues

## 🎉 部署成功！

恭喜你成功将"教练伙伴"部署到 Railway！现在你的 AI 教练助手已经可以在云端为用户服务了。

---

**提示**：首次部署后，建议完整测试所有功能，确保用户画像、对话、报告生成等功能都正常工作。

