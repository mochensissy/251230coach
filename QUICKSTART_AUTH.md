# 🚀 快速开始指南 - 注册和管理员系统

## 📦 本地测试步骤

### 1. 更新数据库结构

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库变更（开发环境）
npx prisma db push
```

### 2. 创建初始管理员账号

**选项 A：使用 Prisma Studio（推荐）**

```bash
npx prisma studio
```

在浏览器中打开后：
1. 选择 `users` 表
2. 点击 "Add record"
3. 填写以下信息：
   - `username`: admin
   - `password`: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
   - `isAdmin`: ✓ (勾选)
   - `onboardingCompleted`: ✓ (勾选)
4. 保存

**选项 B：直接执行 SQL**

```bash
# SQLite
sqlite3 prisma/prisma/dev.db
```

```sql
INSERT INTO users (username, password, isAdmin, onboardingCompleted, createdAt, updatedAt)
VALUES (
  'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  1,
  1,
  datetime('now'),
  datetime('now')
);
```

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin`

### 3. 启动应用

```bash
npm run dev
```

访问：http://localhost:3000

### 4. 管理员配置流程

#### Step 1: 登录管理员账号
1. 访问 http://localhost:3000/login
2. 输入用户名：`admin`
3. 输入密码：`admin`
4. 自动跳转到管理员后台

#### Step 2: 配置 DeepSeek API
1. 点击"API 配置"卡片
2. 输入你的 DeepSeek API Key
3. 点击"保存配置"

> 💡 获取 API Key：访问 https://platform.deepseek.com

#### Step 3: 生成激活码
1. 返回管理员后台
2. 点击"激活码管理"卡片
3. 点击"生成激活码"按钮
4. 设置：
   - 生成数量：5
   - 备注：测试用户
   - 有效期：30天（可选）
5. 点击"生成"
6. 复制生成的激活码

### 5. 用户注册测试

#### Step 1: 退出管理员账号
点击右上角"退出登录"

#### Step 2: 注册新用户
1. 访问 http://localhost:3000/register
2. 填写注册信息：
   - 用户名：testuser
   - 密码：password123
   - 确认密码：password123
   - 激活码：（粘贴刚才复制的激活码）
3. 点击"注册"
4. 注册成功后跳转到用户画像采集页面

#### Step 3: 完成画像采集
按照提示完成5步用户画像采集

#### Step 4: 开始使用
1. 进入 Dashboard
2. 选择场景（工作难题或职业发展）
3. 开始 AI 教练对话

## 🎯 功能验证清单

### ✅ 注册功能
- [ ] 用户名长度验证（至少3个字符）
- [ ] 密码长度验证（至少6个字符）
- [ ] 密码一致性验证
- [ ] 激活码验证（存在性、未使用、未过期）
- [ ] 注册成功跳转到画像采集

### ✅ 登录功能
- [ ] 用户名密码验证
- [ ] 管理员自动跳转到后台
- [ ] 普通用户跳转到 Dashboard 或 Onboarding

### ✅ 管理员后台
- [ ] 数据统计展示正确
- [ ] 最近用户列表显示
- [ ] 最近会话列表显示

### ✅ 激活码管理
- [ ] 生成激活码功能
- [ ] 激活码列表显示
- [ ] 复制激活码功能
- [ ] 删除未使用的激活码
- [ ] 已使用激活码不能删除

### ✅ API 配置
- [ ] 保存 DeepSeek API Key
- [ ] API Key 显示/隐藏切换
- [ ] 配置更新成功提示

### ✅ 对话功能
- [ ] 使用配置的 API Key 进行对话
- [ ] 对话流式响应正常
- [ ] GROW 模型阶段切换

## 🐛 常见问题

### Q1: 数据库迁移失败
```bash
# 删除旧的数据库文件
rm prisma/prisma/dev.db

# 重新创建
npx prisma db push
```

### Q2: Prisma Client 未生成
```bash
npx prisma generate
```

### Q3: 管理员无法登录
检查数据库中是否正确创建了管理员账号：
```bash
npx prisma studio
# 查看 users 表，确认 isAdmin 为 true
```

### Q4: 激活码无法使用
- 确认激活码未被使用（isUsed 为 false）
- 检查是否过期（expiresAt）
- 复制激活码时注意不要多复制空格

### Q5: 对话失败，提示 API 未配置
- 管理员登录后台
- 进入 API 配置页面
- 输入有效的 DeepSeek API Key
- 保存配置

## 📱 访问路径

### 公开路径
- `/login` - 登录页面
- `/register` - 注册页面

### 用户路径（需登录）
- `/onboarding` - 用户画像采集
- `/dashboard` - 用户仪表盘
- `/chat/[id]` - 教练对话
- `/report/[id]` - 对话报告

### 管理员路径（需管理员权限）
- `/admin` - 管理员后台首页
- `/admin/activation-codes` - 激活码管理
- `/admin/settings` - API 配置

## 🔐 安全提示

⚠️ **重要**：首次部署后立即修改默认管理员密码！

修改密码步骤：
1. 使用 Prisma Studio 打开 users 表
2. 找到 admin 用户
3. 更新 password 字段为新密码的 SHA256 哈希值

生成密码哈希：
```bash
echo -n "your_new_password" | sha256sum
```

或使用在线工具：https://emn178.github.io/online-tools/sha256.html

## 📚 更多文档

- **完整文档**：[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)
- **Railway 部署**：[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **项目文档**：[README.md](./README.md)

---

**祝你测试顺利！** 🎉

如有问题，请查看详细文档或联系技术支持。

