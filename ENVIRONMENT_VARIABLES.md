# 🔐 Railway 环境变量配置指南

在 Railway Dashboard 中，你需要配置以下环境变量。

## 📋 必需的环境变量

### 1. DATABASE_URL
- **说明**：PostgreSQL 数据库连接地址
- **如何获取**：Railway 会自动注入，无需手动添加
- **格式**：`postgresql://user:password@host:5432/railway`
- **⚠️ 注意**：确保 PostgreSQL 服务已添加到项目中

### 2. DEEPSEEK_API_KEY
- **说明**：DeepSeek AI API 密钥
- **如何获取**：
  1. 访问 https://platform.deepseek.com/
  2. 注册/登录账号
  3. 进入 API Keys 页面
  4. 点击 "Create API Key"
  5. 复制生成的密钥
- **格式**：`sk-xxxxxxxxxxxxxxxx`
- **示例**：`sk-1234567890abcdef`

## 🔧 可选的环境变量

### 3. NEXT_PUBLIC_APP_URL
- **说明**：应用的公开访问地址
- **如何获取**：在 Railway 生成域名后填写
- **格式**：`https://your-app.up.railway.app`
- **用途**：用于生成正确的链接和重定向
- **⚠️ 注意**：修改此变量后需要重新部署

### 4. NODE_ENV
- **说明**：运行环境
- **默认值**：`production`（Railway 会自动设置）
- **通常不需要手动配置**

---

## 📝 在 Railway 中添加环境变量的步骤

### 添加环境变量

1. 打开 Railway Dashboard
2. 选择你的 Next.js 服务（**不是 PostgreSQL 服务**）
3. 点击 **"Variables"** 标签
4. 点击 **"+ New Variable"** 或 **"Add Variable"**
5. 输入变量名：`DEEPSEEK_API_KEY`
6. 输入变量值：`sk-你的密钥`
7. 点击 **"Add"** 保存

**需要添加的变量**：
```
DEEPSEEK_API_KEY = sk-你的密钥
```

### DATABASE_URL 会自动配置

**重要**：`DATABASE_URL` 不需要手动添加！

当你在 Railway 项目中同时部署了：
- Next.js 服务
- PostgreSQL 数据库

Railway 会**自动**将 PostgreSQL 的 `DATABASE_URL` 注入到 Next.js 服务中。

你可以在 Variables 标签中看到所有环境变量，包括：
- 你手动添加的 `DEEPSEEK_API_KEY`
- Railway 自动注入的 `DATABASE_URL`、`PORT` 等

---

## ✅ 验证环境变量

部署成功后，可以通过以下方式验证：

### 1. 查看日志
在 Railway 的 "Logs" 标签中，搜索：
- `DATABASE_URL` - 应该显示 PostgreSQL 连接地址
- `DEEPSEEK_API_KEY` - 不会显示完整值（出于安全考虑）

### 2. 测试功能
- 尝试创建新对话
- 发送消息给 AI
- 如果 AI 正常回复，说明 API Key 配置正确
- 如果数据能保存，说明数据库连接正确

---

## 🚨 安全提示

1. **不要**将 API Key 提交到 Git 仓库
2. **不要**在公开场合分享 API Key
3. **定期**更换 API Key（建议每 3-6 个月）
4. **监控**API 使用量，防止滥用
5. **限制**API Key 的权限（如果平台支持）

---

## 🔄 更新环境变量

如果需要更新环境变量：

1. 在 Railway Dashboard 中找到对应的变量
2. 点击变量右侧的 **"编辑"** 图标
3. 修改值
4. 保存后，点击 **"Redeploy"** 重新部署应用

**⚠️ 注意**：修改环境变量后必须重新部署才能生效！

---

## 📞 常见问题

### Q: DATABASE_URL 在哪里添加？
**A**: 不需要手动添加！添加 PostgreSQL 服务后，Railway 会自动注入。

### Q: 如何知道变量是否生效？
**A**: 查看部署日志，或者测试相关功能（如 AI 对话）。

### Q: API Key 填错了怎么办？
**A**: 在 Variables 标签中编辑，保存后点击 Redeploy。

### Q: 需要 ANTHROPIC_API_KEY 吗？
**A**: 不需要，项目使用的是 DeepSeek API。

---

## 📋 配置清单

部署前，请确认：

- [ ] PostgreSQL 服务已添加
- [ ] `DEEPSEEK_API_KEY` 已配置
- [ ] 已从 PostgreSQL 引用 `DATABASE_URL`
- [ ] 所有变量名拼写正确
- [ ] API Key 有效且有余额

完成后，点击 **Deploy** 开始部署！🚀

