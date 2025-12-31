# 🔧 Railway DATABASE_URL 配置说明

## 问题说明

Railway 部署时遇到 `DATABASE_URL` 环境变量找不到的问题。

### 原因

- **构建阶段**：`prisma generate` 需要读取 schema.prisma，而 schema.prisma 引用了 `DATABASE_URL`
- **Railway 行为**：环境变量通常在**运行时**注入，不在**构建时**注入

## 解决方案

我们采用了**两阶段配置**方案：

### 1. 构建时（Build Time）

在 `nixpacks.toml` 和 `railway.json` 中设置**占位符** DATABASE_URL：

```toml
[phases.build]
cmds = [
  'export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railway"',
  'npx prisma generate',
  'npm run build'
]
```

**重要**：这个占位符：
- ✅ 只用于通过 Prisma 的语法验证
- ✅ 不会连接任何真实数据库
- ✅ 不会用于实际的数据操作

### 2. 运行时（Runtime）

Railway 会**自动注入**真实的 `DATABASE_URL`，应用运行时使用的是这个真实的连接字符串。

## 验证部署

部署成功后，可以通过以下方式验证：

### 1. 查看环境变量

在 Railway Next.js 服务的 Variables 标签中，应该能看到：
- `DEEPSEEK_API_KEY`（你手动添加的）
- `DATABASE_URL`（Railway 自动注入的）

### 2. 查看日志

在 Logs 标签中搜索：
- `Prisma Client` - 应该显示成功连接
- `migrate deploy` - 应该显示迁移成功

### 3. 测试功能

访问应用并测试：
- 用户注册/登录
- 创建对话
- 数据能正常保存

## 常见问题

### Q: 构建时的占位符会影响生产环境吗？

**A**: 不会！占位符只在构建时使用，运行时会被 Railway 注入的真实 DATABASE_URL 覆盖。

### Q: 我需要手动添加 DATABASE_URL 吗？

**A**: **不需要**！只要你添加了 PostgreSQL 服务，Railway 会自动注入。

### Q: 如何确认运行时使用的是真实的 DATABASE_URL？

**A**: 查看 Railway Logs，如果数据库操作成功，说明使用的是真实连接。

## 部署流程

现在的部署流程是：

1. **构建阶段**
   ```
   设置占位符 DATABASE_URL
   ↓
   npm install
   ↓
   prisma generate（使用占位符）
   ↓
   npm run build
   ```

2. **启动阶段**
   ```
   Railway 注入真实 DATABASE_URL
   ↓
   prisma migrate deploy（使用真实连接）
   ↓
   npm start（应用使用真实连接）
   ```

## 技术细节

### 为什么 Prisma generate 需要 DATABASE_URL？

Prisma CLI 在生成客户端代码时会验证 schema.prisma 的语法，包括检查环境变量是否定义。虽然不需要真实连接，但需要一个有效的格式。

### 占位符格式

```
postgresql://[用户]:[密码]@[主机]:[端口]/[数据库]
```

我们使用的占位符：
```
postgresql://postgres:postgres@localhost:5432/railway
```

这是一个有效的 PostgreSQL 连接字符串格式，足以通过 Prisma 的验证。

## 成功标志

如果看到以下内容，说明配置成功：

✅ 构建日志中：`✔ Generated Prisma Client`
✅ 部署状态：`Success` 或 `Deployed`
✅ 运行日志中：数据库迁移成功
✅ 应用可以正常访问和操作数据

---

**提示**：如果部署仍然失败，请检查：
1. PostgreSQL 服务是否已添加并运行
2. Next.js 服务和 PostgreSQL 在同一个 Railway 项目中
3. 查看完整的构建和运行日志以获取更多信息

