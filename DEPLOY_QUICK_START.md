# 🚀 Railway 部署快速参考

## ⏱️ 5 分钟快速部署

### 第 1 步：创建项目（1分钟）
```
1. 访问 railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 mochensissy/251230coach
```

### 第 2 步：添加数据库（1分钟）
```
1. 点击 "+ New"
2. 选择 "Database" → "Add PostgreSQL"
3. 等待创建完成
```

### 第 3 步：配置环境变量（2分钟）
```
在 Next.js 服务中：
1. 点击 "Variables" 标签
2. 点击 "+ New Variable" 或 "Add Variable"
3. 添加变量：
   Variable Name: DEEPSEEK_API_KEY
   Value: sk-你的密钥
4. 点击 "Add" 保存

注意：DATABASE_URL 会自动从 PostgreSQL 服务注入，无需手动添加！
```

### 第 4 步：等待部署（1分钟）
```
1. Railway 自动开始部署
2. 查看 "Deployments" 标签
3. 等待状态变为 "Success"
```

### 第 5 步：生成域名（30秒）
```
1. 进入 "Settings"
2. 找到 "Networking"
3. 点击 "Generate Domain"
4. 复制域名
```

---

## ⚡ 关键信息速查

### 必需的环境变量
| 变量 | 来源 | 备注 |
|------|------|------|
| `DATABASE_URL` | Railway 自动注入 | 添加 PostgreSQL 后自动有 |
| `DEEPSEEK_API_KEY` | 从 platform.deepseek.com 获取 | 格式：sk-xxx |

### DeepSeek API Key 获取
```
1. 访问：https://platform.deepseek.com/
2. 注册/登录
3. 进入 "API Keys"
4. 点击 "Create API Key"
5. 复制密钥（只显示一次！）
```

### Railway 项目结构
```
你的项目
├── Next.js 服务 (coaching-partner)
│   ├── Variables: DEEPSEEK_API_KEY
│   └── Variables: DATABASE_URL (引用)
└── PostgreSQL 数据库
    └── DATABASE_URL (自动生成)
```

---

## 🔍 部署验证清单

完成部署后，依次检查：

- [ ] 访问域名，能看到登录页面
- [ ] 能注册新用户（需要激活码）
- [ ] 能完成用户引导
- [ ] 能创建新对话
- [ ] AI 能正常回复
- [ ] 能结束对话并评价

---

## 🚨 常见错误快速修复

### 错误 1: Build Failed
```bash
原因：依赖安装失败
解决：检查 package.json 是否正确
```

### 错误 2: Database Connection Error
```bash
原因：DATABASE_URL 未配置
解决：确保添加了 PostgreSQL 服务并引用了 DATABASE_URL
```

### 错误 3: AI 不回复
```bash
原因：DEEPSEEK_API_KEY 错误或无余额
解决：检查 API Key 是否正确，账户是否有余额
```

### 错误 4: Migration Failed
```bash
原因：数据库表未创建
解决：Railway 会自动运行 prisma migrate deploy
       如果失败，查看 Logs 标签的详细错误
```

---

## 📞 需要帮助？

### 查看详细文档
- `RAILWAY_DEPLOYMENT_CHECKLIST.md` - 完整部署指南
- `ENVIRONMENT_VARIABLES.md` - 环境变量详细说明

### Railway 官方
- 文档：docs.railway.app
- Discord：discord.gg/railway

### 项目仓库
- GitHub：github.com/mochensissy/251230coach

---

## 💡 部署小贴士

1. **首次部署会比较慢**（3-5分钟），耐心等待
2. **修改环境变量后必须重新部署**
3. **PostgreSQL 服务会自动生成 DATABASE_URL**
4. **免费额度足够测试和小规模使用**
5. **可以随时在 Logs 标签查看实时日志**

---

**准备好了吗？开始部署吧！🚀**

按照上面的 5 步操作，你的 AI 教练伙伴将在 5 分钟内上线！

