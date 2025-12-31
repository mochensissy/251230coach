# 🚨 Railway DATABASE_URL 手动配置指南

## 问题

Railway 自动注入的 `DATABASE_URL` 在**构建阶段**不可用，导致 `prisma generate` 失败。

## 解决方案：手动添加 DATABASE_URL

### 📋 详细步骤

#### 第 1 步：找到 PostgreSQL 服务

在 Railway Dashboard 中：

1. 确认你的项目中有 **PostgreSQL** 服务
2. 如果没有，点击 **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. 等待 PostgreSQL 创建完成

---

#### 第 2 步：复制 DATABASE_URL

1. **点击 PostgreSQL 服务**（不是 Next.js 服务）
2. 点击 **"Variables"** 标签
3. 找到 `DATABASE_URL` 变量
4. 点击右侧的**复制图标**或选中文本复制

**DATABASE_URL 格式示例**：
```
postgresql://postgres:xxxxxxxxxxxxx@postgres.railway.internal:5432/railway
```

**⚠️ 重要**：
- 完整复制整个连接字符串
- 包含密码和所有参数
- 不要修改任何内容

---

#### 第 3 步：添加到 Next.js 服务

1. **返回项目视图**，点击你的 **Next.js 服务**（251230coach）
2. 点击 **"Variables"** 标签
3. 点击 **"+ New Variable"** 或 **"Add Variable"**
4. 填写：
   - **Variable Name**: `DATABASE_URL`
   - **Value**: 粘贴刚才复制的连接字符串
5. 点击 **"Add"** 保存

---

#### 第 4 步：等待重新部署

1. Railway 会**自动检测到环境变量变化**
2. 会触发**自动重新部署**
3. 在 **"Deployments"** 标签中查看进度
4. 等待构建完成（约 3-5 分钟）

---

## ✅ 验证配置

### 检查环境变量

在 Next.js 服务的 **Variables** 标签中，应该看到：

```
DEEPSEEK_API_KEY = ******* (你添加的)
DATABASE_URL = postgresql://postgres:***@***.railway.internal:5432/railway (你添加的)
```

### 检查构建日志

在 **"Deployments"** 标签中，点击最新的部署，查看日志：

**成功标志**：
```
✔ Generated Prisma Client (v5.22.0)
✓ Compiled successfully
Creating an optimized production build ...
```

**失败标志**（如果仍然失败）：
```
Error: Environment variable not found: DATABASE_URL
```

---

## 🔍 常见问题

### Q1: 我找不到 PostgreSQL 的 DATABASE_URL

**A**: 确保：
1. PostgreSQL 服务已经创建并运行（状态为 "Active"）
2. 在 PostgreSQL 服务的 "Variables" 标签中查看
3. 如果没有，等待几分钟让 Railway 完成初始化

### Q2: 我已经添加了 DATABASE_URL，但仍然失败

**A**: 检查：
1. 变量名拼写是否正确（`DATABASE_URL`，全大写）
2. 值是否完整复制（包括 `postgresql://` 前缀）
3. 是否保存后触发了重新部署
4. 尝试手动点击 "Redeploy" 重新部署

### Q3: PostgreSQL 和 Next.js 是否需要"连线"？

**A**: **不需要**！只要它们在同一个 Railway 项目中，手动添加 DATABASE_URL 就可以连接。

### Q4: 这个 DATABASE_URL 会过期吗？

**A**: 通常不会。但如果：
- 删除并重新创建 PostgreSQL
- PostgreSQL 重启或迁移
- 需要重新复制新的 DATABASE_URL

---

## 📊 正确的配置示例

### PostgreSQL 服务
```
Variables:
  DATABASE_URL = postgresql://postgres:abc123@postgres.railway.internal:5432/railway
  PGDATABASE = railway
  PGHOST = postgres.railway.internal
  ...
```

### Next.js 服务
```
Variables:
  DEEPSEEK_API_KEY = sk-your-key
  DATABASE_URL = postgresql://postgres:abc123@postgres.railway.internal:5432/railway
  (从 PostgreSQL 复制过来)
```

---

## 🎯 为什么需要手动添加？

Railway 的环境变量注入时机：
- **运行时**：自动注入 ✅
- **构建时**：不自动注入 ❌

而 `prisma generate` 在**构建时**需要读取 DATABASE_URL，所以必须手动添加。

---

## 🚀 完成后

如果配置正确，你应该看到：

1. ✅ 构建成功
2. ✅ 部署状态变为 "Success" 或 "Active"
3. ✅ 可以在 Settings → Networking 中生成公开域名
4. ✅ 访问域名能看到应用页面

---

**现在就去 Railway Dashboard 添加 DATABASE_URL 吧！** 🎉

如果还有问题，请截图或复制：
- PostgreSQL Variables 页面
- Next.js Variables 页面
- 最新的部署日志

