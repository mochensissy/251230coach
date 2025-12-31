# 🚀 Railway 部署准备清单

## ✅ 第一步：代码准备

### 1.1 数据库配置已更新 ✅
- ✅ `prisma/schema.prisma` 已改为使用 PostgreSQL
- ✅ 数据库 URL 使用环境变量 `DATABASE_URL`

### 1.2 检查构建配置
- ✅ `railway.json` - Railway 部署配置
- ✅ `nixpacks.toml` - Nixpacks 构建配置
- ✅ `package.json` - 包含必要的构建脚本

### 1.3 推送最新代码到 GitHub

```bash
git add .
git commit -m "chore: 配置 PostgreSQL 用于生产环境"
git push origin main
```

---

## 🔑 第二步：准备环境变量

在 Railway 部署时，你需要配置以下环境变量：

### 必需的环境变量

| 变量名 | 说明 | 如何获取 | 示例 |
|--------|------|----------|------|
| `DATABASE_URL` | PostgreSQL 数据库地址 | **Railway 自动生成** | `postgresql://user:pass@...` |
| `DEEPSEEK_API_KEY` | DeepSeek AI API Key | [DeepSeek Platform](https://platform.deepseek.com/) | `sk-...` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_APP_URL` | 应用访问地址 | Railway 生成的域名 |
| `NODE_ENV` | 运行环境 | `production` |

---

## 📋 第三步：Railway 部署步骤

### 3.1 创建 Railway 账号
1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录（推荐）

### 3.2 创建新项目
1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择仓库：`mochensissy/251230coach`

### 3.3 添加 PostgreSQL 数据库
1. 在项目页面，点击 **"+ New"**
2. 选择 **"Database"**
3. 选择 **"Add PostgreSQL"**
4. 等待数据库创建完成

### 3.4 配置环境变量
在你的 Next.js 服务中：
1. 点击 **"Variables"** 标签
2. 点击 **"+ New Variable"** 或 **"Add Variable"**
3. 添加以下变量：

```bash
DEEPSEEK_API_KEY=你的API密钥
```

**注意**：`DATABASE_URL` 会自动从 PostgreSQL 服务注入，Railway 会自动处理服务之间的连接，无需手动添加。

### 3.5 验证数据库连接
1. PostgreSQL 服务启动后，Railway 会自动将 `DATABASE_URL` 注入到你的 Next.js 服务
2. 你可以在 Variables 标签中看到所有可用的环境变量（包括自动注入的）
3. 不需要手动添加 Variable Reference

### 3.6 触发部署
1. Railway 会自动检测配置并开始部署
2. 或手动点击 **"Deploy"** 按钮
3. 查看 **"Deployments"** 标签的构建日志

### 3.7 生成公开域名
1. 部署成功后，进入 **"Settings"**
2. 找到 **"Networking"** → **"Public Networking"**
3. 点击 **"Generate Domain"**
4. 你会得到类似 `your-app.up.railway.app` 的域名

---

## 🔍 第四步：验证部署

访问生成的域名，检查以下功能：

- [ ] 登录页面可以访问
- [ ] 可以注册新用户（需要激活码）
- [ ] 引导页面正常显示
- [ ] 可以创建新对话
- [ ] AI 回复正常工作
- [ ] 可以结束对话并提交评价
- [ ] 管理后台可以访问（如果是管理员）

---

## 🛠️ 常见问题排查

### 问题 1：构建失败

**症状**：部署日志显示 "Build failed"

**解决方案**：
```bash
# 检查构建日志中的错误信息
# 常见原因：
1. 依赖安装失败 → 检查 package.json
2. Prisma 生成失败 → 检查 schema.prisma 语法
3. Next.js 构建失败 → 检查代码语法错误
```

### 问题 2：数据库连接失败

**症状**：应用启动失败，日志显示 "database connection error"

**解决方案**：
1. 确认 PostgreSQL 服务已启动（在 Railway 项目中查看）
2. 检查 `DATABASE_URL` 是否正确注入
3. 查看 PostgreSQL 服务的日志

### 问题 3：数据库迁移失败

**症状**：启动日志显示 "Migration failed"

**解决方案**：
```bash
# Railway 会自动运行 prisma migrate deploy
# 如果失败，可以手动执行：

1. 在 Railway 的服务设置中，点击 "Connect"
2. 复制数据库连接命令
3. 在本地终端运行：
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 问题 4：AI 对话不工作

**症状**：对话框没有回复

**解决方案**：
1. 检查 `DEEPSEEK_API_KEY` 是否正确配置
2. 查看应用日志，搜索 "API error"
3. 确认 API Key 有足够的额度

### 问题 5：环境变量未生效

**症状**：应用无法读取环境变量

**解决方案**：
1. 确认变量已在 Railway Variables 中添加
2. 变量名拼写正确（区分大小写）
3. 修改变量后需要重新部署：点击 **"Redeploy"**

---

## 📊 部署后监控

### 查看实时日志
```bash
# 在 Railway Dashboard：
1. 选择你的服务
2. 点击 "Logs" 标签
3. 查看实时日志输出
```

### 监控资源使用
```bash
# 在 Railway Dashboard：
1. 点击 "Metrics" 标签
2. 查看 CPU、内存、网络使用情况
```

### 设置告警（可选）
Railway 会在以下情况自动通知：
- 部署失败
- 应用崩溃
- 资源使用超限

---

## 🎓 DeepSeek API Key 获取指南

### 1. 访问 DeepSeek 平台
https://platform.deepseek.com/

### 2. 注册/登录账号
- 使用邮箱注册
- 或使用第三方账号登录

### 3. 创建 API Key
1. 进入 **API Keys** 页面
2. 点击 **"Create API Key"**
3. 复制生成的密钥（格式：`sk-...`）
4. **重要**：立即保存，密钥只显示一次！

### 4. 充值余额（如需要）
1. 进入 **Billing** 页面
2. 选择充值金额
3. 完成支付

### 5. 使用限制
- 免费额度：具体查看官网
- 请求限制：根据账户等级
- 建议初期充值 $10-20 用于测试

---

## 💰 Railway 费用预估

### Hobby Plan（免费试用）
- **$5 免费额度/月**
- 每月包含：
  - 512MB RAM
  - 1GB 磁盘空间
  - 500 小时运行时间

### 实际使用预估
对于你的教练应用：
- **Next.js 服务**：~200MB RAM，$2-3/月
- **PostgreSQL**：~100MB 存储，$1-2/月
- **总计**：约 $3-5/月（在免费额度内）

### 超出免费额度后
- 按使用量计费
- RAM: $0.000463/GB/hour
- 磁盘: $0.25/GB/month

---

## 🎯 部署检查清单

完成所有步骤后，请确认：

- [ ] 代码已推送到 GitHub
- [ ] PostgreSQL 数据库已配置
- [ ] `DEEPSEEK_API_KEY` 已设置
- [ ] `DATABASE_URL` 已自动注入
- [ ] 应用已成功部署
- [ ] 公开域名已生成
- [ ] 登录功能正常
- [ ] AI 对话功能正常
- [ ] 数据库读写正常
- [ ] 管理后台可访问

---

## 📞 获取帮助

### Railway 官方资源
- 文档：https://docs.railway.app
- Discord：https://discord.gg/railway
- Twitter：@Railway

### 项目相关
- GitHub Issues：https://github.com/mochensissy/251230coach/issues

---

## 🎉 部署成功！

恭喜！你的 AI 教练伙伴已经在云端运行了！

**下一步**：
1. 创建管理员账号
2. 生成激活码
3. 邀请用户测试
4. 收集反馈并优化

祝你使用愉快！🚀

