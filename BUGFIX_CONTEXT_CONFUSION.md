# Bug修复：AI教练上下文混淆问题

## 修复日期
2025-12-31

## 问题描述

### 用户反馈
> "有点窜台。第一次回答还是我的困惑，后来我说也不知道从哪里说起，教练就从另一个问题来说了，这是我很久以前问的其他的问题。这是怎么回事"

### 问题现象
1. 用户在当前session提到："COE岗位没有发挥价值"
2. AI第一次正确回应了这个问题
3. 用户回复："我也不知道从哪里说起"
4. AI第二次却提到了完全不同的问题："bop业务支持不强"
5. **"bop业务支持不强"是用户很久以前在其他session提到的问题**

### 严重性
🔴 **高严重性** - 这会严重破坏用户体验，让用户感觉AI"不在状态"、"窜台"

## 根本原因分析

### 问题根源

在 `src/app/api/coaching/chat/route.ts` 中，系统提示词包含了用户画像的**历史信息**：

```typescript
// 问题代码
const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}
发展目标：${session.user.developmentGoal || '未设置'}  // ❌ 老数据
工作挑战：${session.user.workChallenge || '未设置'}    // ❌ 老数据
`.trim()
```

### 为什么会混淆？

1. **老版本Onboarding**收集了 `developmentGoal` 和 `workChallenge`
2. 这些字段保存在 `User` 表中，是**全局的、持久的**
3. 用户可能在很久以前填写过："bop业务支持不强"
4. 每次对话时，AI都会看到这些**老信息**
5. 当用户说"不知道从哪里说起"时，AI可能会：
   - 看到当前对话："COE岗位没有发挥价值"
   - 也看到用户画像："工作挑战：bop业务支持不强"
   - 混淆了两个问题，选择了错误的上下文

### 数据流图

```
用户画像（User表）
├─ developmentGoal: "提升领导力"  ← 3个月前填写
├─ workChallenge: "bop业务支持不强" ← 3个月前填写
└─ ...

当前Session
├─ 场景: work_problem
├─ 初始问题: "COE岗位没有发挥价值" ← 今天填写
└─ 对话历史:
    ├─ User: "COE岗位没有发挥价值"
    ├─ AI: "我看到你提到：COE岗位..." ✅ 正确
    ├─ User: "我也不知道从哪里说起"
    └─ AI: "你提到bop业务支持不强..." ❌ 错误！混淆了

系统提示词（发送给AI）
├─ 用户画像: "工作挑战：bop业务支持不强" ← 老数据
└─ 对话历史: "COE岗位没有发挥价值" ← 新数据

AI看到两个问题，混淆了！
```

## 解决方案

### 修复方法

**移除系统提示词中的历史问题字段**

```typescript
// 修复后的代码
const userProfile = `
角色：${session.user.role || '未设置'}
业务线：${session.user.businessLine || '未设置'}
工作风格：${session.user.workStyle || '未设置'}
`.trim()

// 不再包含 developmentGoal 和 workChallenge
// 这些是历史数据，会与当前session主题混淆
```

### 为什么这样修复？

1. **当前session的主题**已经在对话历史中了
   - 开场白会引用用户填写的 `specificQuestion`
   - 对话历史完整记录了当前讨论的问题

2. **用户画像应该只包含"稳定的"信息**
   - 角色：不常变
   - 业务线：不常变
   - 工作风格：不常变
   - ~~发展目标~~：经常变，不应该在画像中
   - ~~工作挑战~~：经常变，不应该在画像中

3. **避免跨session污染**
   - 每个session应该是独立的对话
   - 不应该混入其他session的问题

## 数据模型演进

### 老版本（有问题）

```
User表
├─ developmentGoal: string  ← 全局的，会混淆
└─ workChallenge: string    ← 全局的，会混淆

Onboarding收集
├─ 步骤4: "你的发展目标是什么？"
└─ 步骤5: "你的工作挑战是什么？"

问题：
- 用户可能有多个不同的目标和挑战
- 保存在User表中会覆盖之前的内容
- 每次对话都会看到最后一次填写的内容
```

### 新版本（已修复）

```
User表
├─ role: string           ← 稳定信息
├─ businessLine: string   ← 稳定信息
└─ workStyle: string      ← 稳定信息

Onboarding收集
├─ 步骤4: 选择场景（工作难题/职业发展）
└─ 步骤5: 填写具体问题 → 保存到 sessionStorage

Session
├─ scenario: string       ← 当前session的场景
└─ messages: []           ← 包含初始问题和对话历史

优势：
- 每个session独立，不会混淆
- 初始问题在开场白中引用
- 对话历史完整记录当前主题
```

## 影响范围

### 受影响的功能
- ✅ **对话功能** - 核心修复，不再混淆上下文
- ✅ **系统提示词** - 更简洁，更准确
- ⚠️ **老用户数据** - User表中的老字段仍然存在，但不再使用

### 不受影响的功能
- ✅ 用户认证
- ✅ Session管理
- ✅ 报告生成
- ✅ 数据分析

## 测试验证

### 测试1：新session不混淆
1. 创建新的对话session
2. 填写问题："团队协作效率低"
3. 进行多轮对话
4. **期望**：AI始终围绕"团队协作效率"这个主题

### 测试2：多个session独立
1. 创建session A，讨论"团队协作"
2. 创建session B，讨论"职业发展"
3. 在session B中对话
4. **期望**：AI不会提到"团队协作"

### 测试3：老用户数据不干扰
1. 使用有历史数据的老账号
2. 创建新session
3. **期望**：AI不会提到User表中的老问题

## 数据清理（可选）

如果需要彻底清理老数据：

```sql
-- 清空User表中的老字段
UPDATE users 
SET 
  developmentGoal = NULL,
  workChallenge = NULL
WHERE 
  developmentGoal IS NOT NULL 
  OR workChallenge IS NOT NULL;
```

**注意：** 这是可选的，因为修复后这些字段已经不再使用了。

## 预防措施

### 1. 数据模型设计原则
- **User表**：只存储稳定的、长期的信息
- **Session表**：存储临时的、会话级的信息
- **Message表**：存储对话历史

### 2. 系统提示词设计原则
- 只包含当前session相关的信息
- 避免包含可能过时的历史信息
- 让对话历史说话，而不是用户画像

### 3. 代码审查检查点
- [ ] 新增的用户画像字段是否会随时间变化？
- [ ] 系统提示词中的信息是否都是当前session相关的？
- [ ] 是否有可能跨session污染的风险？

## 总结

这次修复：
- ✅ 解决了AI"窜台"的问题
- ✅ 让每个session独立、清晰
- ✅ 简化了系统提示词
- ✅ 提升了对话质量和用户体验

**核心教训：** 不要在系统提示词中包含可能过时或跨session的信息，让对话历史自己说话。


