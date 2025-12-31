# 引导流程缓存问题修复

## 问题描述

**现象**: 新注册用户登录后，引导流程直接跳转到第5步（最后一步），而不是从第1步开始。

**根本原因**: 
1. `useOnboardingStore` 使用了 Zustand 的 `persist` 中间件
2. 引导流程的状态（包括 `currentStep`）被保存到 `localStorage` 的 `onboarding-storage` 键中
3. 当之前有用户完成过引导流程时，`currentStep` 被保存为 4（第5步）
4. 新用户登录时，会读取到之前用户的缓存状态，导致从第5步开始

**影响**: 
- ❌ 新注册用户无法看到完整的引导流程
- ❌ 用户体验差，缺少必要的信息收集
- ❌ 可能导致用户资料不完整

## 解决方案

### 修复 1: 注册时清空 onboarding 缓存

**修改文件**: `src/app/register/page.tsx`

**修改内容**:
```typescript
// 修改前
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('token', data.token);
router.push('/onboarding');

// 修改后
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('token', data.token);
// 清空之前的 onboarding 缓存，确保从第一步开始
localStorage.removeItem('onboarding-storage');
router.push('/onboarding');
```

**效果**: 新注册用户的引导流程从第1步开始

### 修复 2: 登录时清空未完成用户的缓存

**修改文件**: `src/app/login/page.tsx`

**修改内容**:
```typescript
// 修改前
if (!data.user.onboardingCompleted) {
  router.push('/onboarding');
}

// 修改后
if (!data.user.onboardingCompleted) {
  // 未完成引导的用户，清空之前的缓存，从第一步开始
  localStorage.removeItem('onboarding-storage');
  router.push('/onboarding');
}
```

**效果**: 未完成引导的用户重新登录时，从第1步开始

### 修复 3: Onboarding 页面初始化时重置状态

**修改文件**: `src/app/onboarding/page.tsx`

**修改内容**:
```typescript
// 修改前
useEffect(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    router.push('/login')
    return
  }

  const user = JSON.parse(userStr)
  if (user.onboardingCompleted) {
    router.push('/dashboard')
  }
}, [router])

// 修改后
useEffect(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    router.push('/login')
    return
  }

  const user = JSON.parse(userStr)
  if (user.onboardingCompleted) {
    router.push('/dashboard')
    return
  }

  // 新用户：重置 onboarding 状态，从第一步开始
  setStep(0)
  updateData('username', user.username)
}, [router, setStep, updateData])
```

**效果**: 
- 确保新用户从第1步开始
- 自动填充用户名到表单

### 修复 4: 注册 API 明确设置 onboardingCompleted

**修改文件**: `src/app/api/auth/register/route.ts`

**修改内容**:
```typescript
// 修改前
const newUser = await tx.user.create({
  data: {
    username,
    password: hashPassword(password),
    activationCodeId: codeRecord.id,
  },
});

// 修改后
const newUser = await tx.user.create({
  data: {
    username,
    password: hashPassword(password),
    activationCodeId: codeRecord.id,
    onboardingCompleted: false, // 明确设置为 false
  },
});
```

**效果**: 确保新用户的 `onboardingCompleted` 状态正确

## 用户流程对比

### 修复前 ❌

#### 新注册用户
1. 注册成功
2. 跳转到 onboarding 页面
3. **直接显示第5步** ❌
4. 缺少前4步的信息收集

#### 未完成引导的用户重新登录
1. 登录成功
2. 跳转到 onboarding 页面
3. **可能显示之前的步骤** ❌
4. 状态混乱

### 修复后 ✅

#### 新注册用户
1. 注册成功
2. **清空 onboarding 缓存**
3. 跳转到 onboarding 页面
4. **从第1步开始** ✅
5. 完整的引导流程体验

#### 未完成引导的用户重新登录
1. 登录成功
2. **清空 onboarding 缓存**
3. 跳转到 onboarding 页面
4. **从第1步开始** ✅
5. 重新完成引导流程

#### 已完成引导的用户
1. 登录成功
2. **直接跳转到 dashboard** ✅
3. 无需再次引导

## 技术细节

### Zustand Persist 机制

```typescript
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: {},
      setStep: (step) => set({ currentStep: step }),
      updateData: (key, value) =>
        set((state) => ({
          data: { ...state.data, [key]: value },
        })),
      resetData: () => set({ currentStep: 0, data: {} }),
    }),
    {
      name: 'onboarding-storage', // localStorage 键名
    }
  )
)
```

**问题**: 
- `persist` 会将整个 store 状态保存到 localStorage
- 跨用户会话共享状态
- 没有用户隔离机制

**解决方案**:
- 在关键节点清空缓存
- 在页面初始化时重置状态

### 清空缓存的时机

| 时机 | 操作 | 原因 |
|------|------|------|
| 注册成功后 | `localStorage.removeItem('onboarding-storage')` | 确保新用户从第1步开始 |
| 登录时（未完成引导） | `localStorage.removeItem('onboarding-storage')` | 重置未完成用户的状态 |
| Onboarding 页面加载 | `setStep(0)` | 双重保险，确保从第1步开始 |

## 测试验证

### 测试场景 1: 新用户注册

**步骤**:
1. 访问注册页面
2. 填写用户名、密码、激活码
3. 点击注册
4. 观察引导流程起始步骤

**预期结果**: 
- ✅ 显示"步骤 1/5"
- ✅ 显示欢迎页面
- ✅ 用户名已自动填充

**实际结果**: ✅ 通过

### 测试场景 2: 未完成引导的用户重新登录

**步骤**:
1. 注册新用户但不完成引导流程
2. 退出登录
3. 重新登录
4. 观察引导流程起始步骤

**预期结果**: 
- ✅ 显示"步骤 1/5"
- ✅ 从第1步重新开始

**实际结果**: ✅ 通过

### 测试场景 3: 已完成引导的用户登录

**步骤**:
1. 使用 testuser 登录
2. 观察跳转目标

**预期结果**: 
- ✅ 直接跳转到 dashboard
- ✅ 不显示引导页面

**实际结果**: ✅ 通过

## 影响范围

### 修改的文件
1. `src/app/register/page.tsx` - 注册页面
2. `src/app/login/page.tsx` - 登录页面
3. `src/app/onboarding/page.tsx` - 引导流程页面
4. `src/app/api/auth/register/route.ts` - 注册 API

### 受影响的功能
- ✅ 新用户注册流程
- ✅ 用户登录流程
- ✅ 引导流程体验

### 不受影响的功能
- ✅ 已完成引导的用户登录
- ✅ 管理员登录
- ✅ 教练对话功能
- ✅ 其他业务功能

## 后续优化建议

### 短期优化
1. **用户隔离的缓存机制**
   - 将 onboarding 状态与用户 ID 关联
   - 使用 `onboarding-storage-${userId}` 作为键名
   - 避免跨用户状态污染

2. **引导流程断点续传**
   - 允许用户中途退出
   - 下次登录时从上次的步骤继续
   - 而不是每次都从第1步开始

### 长期优化
1. **服务端状态管理**
   - 将引导进度保存到数据库
   - 避免依赖客户端缓存
   - 支持多设备同步

2. **引导流程版本管理**
   - 当引导流程更新时
   - 已完成的用户可以选择重新体验
   - 或只补充新增的步骤

## 用户体验改进

### 改进前 ❌
- 新用户看到第5步，感到困惑
- 缺少前4步的信息收集
- 用户资料不完整
- 体验不连贯

### 改进后 ✅
- 新用户从第1步开始，流程清晰
- 完整的信息收集
- 用户资料完整
- 体验流畅自然

## 注意事项

⚠️ **重要提示**:

1. **缓存清理**
   - 修复后，建议清理浏览器缓存
   - 或手动删除 localStorage 中的 `onboarding-storage`

2. **测试环境**
   - 在不同浏览器中测试
   - 测试隐私模式下的行为
   - 测试多用户切换场景

3. **向后兼容**
   - 修改完全向后兼容
   - 不影响已完成引导的用户
   - 不需要数据迁移

## 更新日志

**版本**: v1.3  
**日期**: 2025-12-31  
**类型**: Bug Fix

**修复内容**:
- 🐛 修复新用户引导流程从第5步开始的问题
- 🔧 在注册和登录时清空 onboarding 缓存
- ✨ Onboarding 页面初始化时重置状态
- 📝 注册 API 明确设置 onboardingCompleted 状态

**测试状态**: ✅ 全部通过

