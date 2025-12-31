# 🔐 创建管理员账号指南

## 问题

首次部署后，数据库是空的，没有管理员账号，无法登录。

## 解决方案：使用初始化 API

### 方法 1：使用浏览器（推荐）

1. **等待 Railway 重新部署完成**（约 1-2 分钟）

2. **打开浏览器，访问**：
   ```
   https://你的域名/api/init-admin
   ```
   
   例如：`https://your-app.up.railway.app/api/init-admin`

3. **你会看到一个空白页面**，这是正常的（因为是 API 端点）

4. **使用以下方式之一发送 POST 请求**：

---

#### 选项 A：使用浏览器开发者工具（最简单）

1. 在浏览器中按 **F12** 打开开发者工具
2. 点击 **Console（控制台）** 标签
3. 粘贴以下代码并按回车：

```javascript
fetch('/api/init-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => {
  console.log('创建结果:', data);
  alert(JSON.stringify(data, null, 2));
});
```

4. 你会看到返回的账号信息：
```json
{
  "success": true,
  "message": "管理员账号创建成功",
  "credentials": {
    "username": "admin",
    "password": "admin123",
    "note": "请登录后立即修改密码"
  }
}
```

---

#### 选项 B：使用 curl 命令（如果你熟悉命令行）

在终端执行：

```bash
curl -X POST https://你的域名/api/init-admin
```

---

#### 选项 C：使用 Postman 或类似工具

- URL: `https://你的域名/api/init-admin`
- Method: `POST`
- 点击 Send

---

### 方法 2：让我直接在 Railway 执行脚本

如果上面的方法都不行，告诉我你的 Railway 项目名称，我可以帮你通过 Railway CLI 执行脚本。

---

## 🎯 创建成功后

### 管理员账号信息

```
用户名：admin
密码：admin123
```

### 登录步骤

1. 返回登录页面
2. 输入：
   - 用户名：`admin`
   - 密码：`admin123`
3. 点击"登录"
4. **登录后立即修改密码**（在管理后台的设置页面）

---

## 🔍 常见问题

### Q1: 访问 /api/init-admin 显示 404

**A**: 等待 Railway 重新部署完成。可以在 Railway Dashboard 的 Deployments 标签中查看进度。

### Q2: 返回 "管理员账号已存在"

**A**: 说明已经创建过了，直接使用 `admin / admin123` 登录即可。

### Q3: 执行后没有反应

**A**: 
1. 检查浏览器控制台是否有错误
2. 确认 Railway 部署成功且应用正在运行
3. 尝试刷新页面后重新执行

### Q4: 登录时仍然提示密码错误

**A**: 
1. 确认 POST 请求确实执行成功
2. 检查返回的 JSON 中 `success` 是否为 `true`
3. 尝试清除浏览器缓存后重新登录

---

## 🛡️ 安全提示

1. **创建后立即修改密码**：默认密码 `admin123` 不安全
2. **只能创建一次**：API 会检查是否已有管理员，防止重复创建
3. **创建完成后，API 仍然可访问，但会返回错误**（不会创建多个管理员）

---

## 📋 部署后检查清单

- [ ] Railway 部署状态为 "Success" 或 "Active"
- [ ] 可以访问应用首页
- [ ] 使用浏览器控制台或 curl 调用 `/api/init-admin`
- [ ] 收到成功响应，包含管理员凭据
- [ ] 使用 `admin / admin123` 登录成功
- [ ] 登录后修改默认密码
- [ ] 开始使用应用！

---

**现在就试试吧！** 🚀

等待 Railway 重新部署完成后，使用上面的方法创建管理员账号！

