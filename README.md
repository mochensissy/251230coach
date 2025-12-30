# 教练伙伴 - AI 教练助手

基于 ICF（国际教练联盟）标准的智能教练对话系统，为公司内部员工提供 100% 私密、非指导性的教练式对话服务。

## 📋 项目概述

**核心价值主张：**
- **纯教练模式**：AI 扮演 100% ICF 教练角色，绝不提供直接建议
- **绝对隐私**：所有对话记录仅用户本人可见，管理员无法调阅
- **结构化对话**：基于 GROW 模型（Goal-Reality-Options-Will）的专业流程
- **个性化支持**：通过用户画像提供定制化的教练体验

## ✨ 主要功能

### 模块 1：用户画像采集（F-1）
- 首次使用时的引导式问卷
- 采集角色、业务线、工作风格、发展目标等信息
- 分步卡片式交互，降低用户负担

### 模块 2：核心教练对话（F-2）
- 基于 GROW 模型的结构化对话
- 两大场景入口：工作难题、职业发展
- AI 通过开放式提问引导用户自主探索
- 实时流式响应，自然流畅的对话体验

### 模块 3：总结报告（F-3）
- 对话结束后可生成结构化总结报告
- 包含：议题、关键洞察、行动计划、承诺与奖赏
- 支持下载 PDF（打印友好）

## 🛠 技术栈

- **前端框架**：Next.js 15 (App Router) + React 18
- **UI 组件**：Tailwind CSS + Lucide Icons
- **状态管理**：Zustand
- **数据库**：SQLite (开发) / PostgreSQL (生产) + Prisma ORM
- **AI 服务**：Claude API (Anthropic) - Claude 3.5 Sonnet
- **部署**：Vercel / 自托管

## 📦 快速开始

### 1. 克隆项目

\`\`\`bash
cd coaching-partner
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 配置环境变量

创建 \`.env.local\` 文件：

\`\`\`env
# 数据库
DATABASE_URL="file:./dev.db"

# Claude API
ANTHROPIC_API_KEY="your-claude-api-key-here"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

> 说明：如果未设置 `DATABASE_URL`，系统会自动回退到仓库自带的 `prisma/dev.db`（仅适合本地开发）。生产环境仍需显式配置数据库地址。

**获取 Claude API Key：**
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册/登录账号
3. 在 API Keys 页面创建新的 API Key
4. 将 Key 填入 \`.env.local\` 文件

### 4. 初始化数据库

\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📂 项目结构

\`\`\`
coaching-partner/
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── api/                  # API 路由
│   │   │   ├── onboarding/       # 用户画像采集 API
│   │   │   ├── sessions/         # 会话管理 API
│   │   │   ├── coaching/         # 教练对话 API
│   │   │   └── reports/          # 报告生成 API
│   │   ├── onboarding/           # 画像采集页面
│   │   ├── dashboard/            # 仪表盘页面
│   │   ├── chat/[id]/            # 对话页面
│   │   └── report/[id]/          # 报告页面
│   ├── lib/                      # 工具库
│   │   ├── prisma.ts             # Prisma 客户端
│   │   ├── claude.ts             # Claude API 配置
│   │   └── store.ts              # Zustand 状态管理
│   └── components/               # React 组件（待扩展）
├── prisma/
│   └── schema.prisma             # 数据库 Schema
├── public/                       # 静态资源
├── .env.local                    # 环境变量（需自行创建）
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # Tailwind 配置
└── package.json                  # 项目依赖
\`\`\`

## 🔒 安全与隐私

### 数据隔离
- 每个用户只能访问自己的数据
- API 层面强制用户身份验证
- 数据库级别的访问控制

### 匿名分析
- 行为日志不记录用户 ID 或可识别信息
- 仅收集聚合维度数据（角色类型、业务线等）
- 用于产品优化和看板展示

### 心理健康安全边界
- AI 能识别严重心理健康风险信号
- 自动停止教练对话并提供专业资源转介
- 确保用户安全

## 🎯 核心设计原则

### ICF 教练标准
1. **建立信任和亲密关系**
2. **积极倾听**
3. **提出强有力的问题**
4. **直接沟通**
5. **提高觉察**
6. **设计行动计划**
7. **计划和目标设定**
8. **管理进展和责任**

### GROW 模型
- **Goal（目标）**：用户想达成什么？
- **Reality（现状）**：当前情况如何？
- **Options（选择）**：有哪些可能性？
- **Will（意愿）**：用户打算采取什么行动？

## 📊 数据库结构

主要表：
- \`users\` - 用户信息
- \`sessions\` - 对话会话
- \`messages\` - 对话消息
- \`summary_reports\` - 总结报告
- \`analytics_logs\` - 匿名行为日志
- \`feedback\` - 用户反馈
- \`settings\` - 系统配置

详见 \`prisma/schema.prisma\`

## 🚀 部署指南

### Railway 部署（推荐）⭐

Railway 提供了最简单的一键部署体验，自动处理数据库和环境配置。

**详细步骤请查看：[Railway 部署指南](./RAILWAY_DEPLOYMENT.md)**

快速步骤：
1. 访问 [Railway](https://railway.app) 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择本仓库
4. 添加 PostgreSQL 数据库
5. 配置环境变量（API Keys）
6. 等待自动部署完成

### Vercel 部署

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（同 \`.env.local\`）
4. 数据库切换到 PostgreSQL（推荐使用 Vercel Postgres）
5. 部署完成

### 自托管部署

\`\`\`bash
# 构建项目
npm run build

# 启动生产服务器
npm start
\`\`\`

## 🛣 开发路线图

### Phase 1: MVP 核心功能 ✅
- [x] 用户画像采集
- [x] 基础对话界面
- [x] Claude API 集成
- [x] 对话记录存储

### Phase 2: 完善对话体验 🚧
- [ ] GROW 模型结构化对话
- [ ] 引导式开场白和提问交互
- [ ] 对话状态管理和阶段判断

### Phase 3: 报告和历史
- [ ] 总结报告生成
- [ ] 历史记录查看
- [ ] 报告下载功能

### Phase 4: 优化和安全
- [ ] 安全边界实现
- [ ] 匿名数据日志
- [ ] 性能优化和测试

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

本项目仅供内部使用，版权所有。

## 📞 支持

如有问题，请联系开发团队。

---

**祝你使用愉快！通过教练式对话，激发潜能，厘清思路！** 🚀
