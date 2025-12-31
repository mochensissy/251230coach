# 结束对话与评价功能

## 实施日期
2025-12-31

## 功能概述

### 用户需求
> "其实并没有完成，但是显示完成了。是不是对话中能有一个键，能随时结束此次对话？然后教练也可以提醒，此次对话并没有结束（前提是真的没有结束），是否确定结束？如果用户确定，就给出一个反馈评价，此次对话是否有帮助。帮助如果五颗星那么用户可以选择点亮几颗星。然后这个指标也可以记录到后台管理作为一个指标来看。"

### 核心功能

1. **主动结束对话** - 用户随时可以点击"结束对话"按钮
2. **智能提醒** - AI判断对话是否完整，给出提醒
3. **确认机制** - 用户确认是否真的要结束
4. **五星评价** - 收集用户反馈
5. **数据统计** - 评分记录到后台管理

## 功能流程

### 流程图

```
用户点击"结束对话"
    ↓
检查对话完整性
    ├─ 对话较短（<10条消息）
    │   ↓
    │  显示提醒弹窗
    │   ├─ 用户选择"继续对话" → 关闭弹窗
    │   └─ 用户选择"确认结束" → 显示评分弹窗
    │
    └─ 对话完整（≥10条消息）
        ↓
       直接显示评分弹窗
            ↓
        用户打分（1-5星）
            ↓
        保存反馈到数据库
            ↓
        更新session状态为completed
            ↓
        跳转回Dashboard
```

## 技术实现

### 1. 前端UI组件

**文件：** `src/app/chat/[id]/page.tsx`

#### 结束对话按钮

```typescript
<button
  onClick={handleEndSession}
  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
>
  结束对话
</button>
```

#### 确认弹窗

```typescript
{showEndDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        确认结束对话？
      </h3>
      <p className="text-gray-600 mb-6">
        我注意到这次对话还比较简短。通常一次完整的教练对话需要更多的探讨和反思。
        你确定要现在结束吗？我们可以继续深入探讨，帮助你获得更多洞察。
      </p>
      <div className="flex gap-3">
        <button onClick={() => setShowEndDialog(false)}>
          继续对话
        </button>
        <button onClick={confirmEndSession}>
          确认结束
        </button>
      </div>
    </div>
  </div>
)}
```

#### 评分弹窗

```typescript
{showRatingDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        感谢你的参与！
      </h3>
      <p className="text-gray-600 mb-6">
        这次对话对你有帮助吗？请给我们打个分吧！
      </p>
      
      {/* 五星评分 */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-4xl transition-all hover:scale-110"
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.push('/dashboard')}>
          跳过
        </button>
        <button onClick={submitRating} disabled={rating === 0}>
          提交
        </button>
      </div>
    </div>
  </div>
)}
```

### 2. 处理逻辑

#### 判断对话完整性

```typescript
const handleEndSession = () => {
  // 检查对话是否真的完成（至少5轮对话 = 10条消息）
  if (messages.length < 10) {
    setShowEndDialog(true)  // 显示提醒
  } else {
    setShowRatingDialog(true)  // 直接评分
  }
}
```

**判断标准：**
- 少于10条消息（5轮对话）→ 认为对话不完整
- 10条或更多消息 → 认为对话完整

#### 提交评分

```typescript
const submitRating = async () => {
  try {
    // 1. 保存评分
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: parseInt(sessionId),
        username,
        npsScore: rating,
      }),
    })

    // 2. 更新session状态为completed
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
      }),
    })

    // 3. 跳转回Dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Failed to submit rating:', error)
  }
}
```

### 3. 后端API

#### Feedback API

**文件：** `src/app/api/feedback/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { sessionId, username, npsScore, feedbackText } = await request.json()

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { username },
  })

  // 创建反馈记录
  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      sessionId: parseInt(sessionId),
      npsScore: npsScore || null,
      feedbackText: feedbackText || null,
    },
  })

  return NextResponse.json({
    success: true,
    feedback,
  })
}
```

#### Session Update API

**文件：** `src/app/api/sessions/[id]/route.ts`

```typescript
export async function PATCH(request: NextRequest, { params }) {
  const { id } = await params
  const { status } = await request.json()

  // 更新session状态
  const session = await prisma.session.update({
    where: { id: parseInt(id) },
    data: {
      status,
      endedAt: status === 'completed' ? new Date() : undefined,
      durationMinutes: status === 'completed' ? calculateDuration() : undefined,
    },
  })

  return NextResponse.json({
    success: true,
    session,
  })
}
```

## 数据库结构

### Feedback表

```prisma
model Feedback {
  id            Int       @id @default(autoincrement())
  userId        Int
  sessionId     Int?
  npsScore      Int?      // 1-5星评分
  feedbackText  String?   // 文字反馈（可选）
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
}
```

### Session表状态字段

```prisma
model Session {
  status          String    @default("in_progress")
  // 'in_progress', 'completed', 'abandoned'
  endedAt         DateTime?
  durationMinutes Int?
}
```

## 评分标准

### NPS Score (1-5星)

| 评分 | 含义 | 用户感受 |
|------|------|----------|
| ⭐ 1星 | 非常不满意 | 完全没有帮助 |
| ⭐⭐ 2星 | 不满意 | 帮助很小 |
| ⭐⭐⭐ 3星 | 一般 | 有一些帮助 |
| ⭐⭐⭐⭐ 4星 | 满意 | 很有帮助 |
| ⭐⭐⭐⭐⭐ 5星 | 非常满意 | 非常有帮助 |

## 用户体验设计

### 1. 提醒文案

**对话不完整时：**
```
确认结束对话？

我注意到这次对话还比较简短。通常一次完整的教练对话需要更多的探讨和反思。

你确定要现在结束吗？我们可以继续深入探讨，帮助你获得更多洞察。

[继续对话] [确认结束]
```

**设计理念：**
- 温和提醒，不强制
- 说明原因（对话较短）
- 给出建议（继续探讨）
- 尊重用户选择

### 2. 评分界面

```
感谢你的参与！

这次对话对你有帮助吗？请给我们打个分吧！

☆ ☆ ☆ ☆ ☆

[跳过] [提交]
```

**设计理念：**
- 简洁明了
- 允许跳过
- 视觉反馈（星星点亮）
- 快速完成

## 数据统计

### 后台管理可展示的指标

1. **平均评分**
   ```sql
   SELECT AVG(npsScore) FROM feedback WHERE npsScore IS NOT NULL
   ```

2. **评分分布**
   ```sql
   SELECT npsScore, COUNT(*) FROM feedback GROUP BY npsScore
   ```

3. **完成率**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) 
   FROM sessions
   ```

4. **平均对话时长**
   ```sql
   SELECT AVG(durationMinutes) FROM sessions WHERE status = 'completed'
   ```

5. **评分趋势**
   ```sql
   SELECT 
     DATE(createdAt) as date,
     AVG(npsScore) as avg_score
   FROM feedback
   GROUP BY DATE(createdAt)
   ORDER BY date
   ```

## 测试场景

### 测试1：短对话提醒
1. 开始新对话
2. 只发送2-3条消息
3. 点击"结束对话"
4. **期望**：显示提醒弹窗

### 测试2：完整对话
1. 开始新对话
2. 进行5轮以上对话
3. 点击"结束对话"
4. **期望**：直接显示评分弹窗

### 测试3：继续对话
1. 触发提醒弹窗
2. 点击"继续对话"
3. **期望**：关闭弹窗，可以继续对话

### 测试4：评分提交
1. 显示评分弹窗
2. 点击3颗星
3. 点击"提交"
4. **期望**：保存评分，跳转到Dashboard

### 测试5：跳过评分
1. 显示评分弹窗
2. 点击"跳过"
3. **期望**：不保存评分，跳转到Dashboard

## 优势总结

### 用户体验
- ✅ **主动权**：用户可以随时结束对话
- ✅ **智能提醒**：避免过早结束
- ✅ **尊重选择**：不强制继续
- ✅ **快速反馈**：简单的五星评分

### 产品价值
- ✅ **数据收集**：了解用户满意度
- ✅ **质量监控**：发现问题对话
- ✅ **持续改进**：基于反馈优化
- ✅ **用户洞察**：理解用户需求

### 技术实现
- ✅ **简单直观**：清晰的UI和流程
- ✅ **数据完整**：记录评分和状态
- ✅ **易于扩展**：可以添加文字反馈
- ✅ **性能良好**：无额外负担

## 后续优化建议

### 1. 文字反馈
在评分后添加可选的文字反馈框：
```
你还有什么想说的吗？（可选）
[文本框]
```

### 2. 智能判断优化
除了消息数量，还可以考虑：
- 对话时长
- GROW阶段完成度
- 是否有行动计划

### 3. 评分提醒
对于低分（1-2星），可以：
- 弹出文字反馈框
- 询问具体问题
- 提供改进建议

### 4. 数据可视化
在管理后台展示：
- 评分趋势图
- 评分分布饼图
- 完成率统计
- 平均时长变化

## 总结

这次功能实现：
- ✅ 解决了对话状态不准确的问题
- ✅ 给予用户主动结束对话的权利
- ✅ 通过智能提醒提高对话质量
- ✅ 收集用户反馈用于产品改进
- ✅ 为后台管理提供数据支持

**核心价值：** 让用户有掌控感，同时通过数据驱动产品优化。


