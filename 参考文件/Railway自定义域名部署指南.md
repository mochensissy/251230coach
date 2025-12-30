# Railway 自定义域名部署指南（小白版）

> 本指南将帮助你在 Railway 上绑定自己购买的域名，全程图文说明，适合零基础用户。

---

## 📋 准备工作

在开始之前，请确保你已经准备好以下内容：

1. ✅ 一个 **Railway 账户**（已部署好你的项目）
2. ✅ 一个 **已购买的域名**（如在阿里云、腾讯云、Namesilo、GoDaddy 等平台购买）
3. ✅ 能够访问你的 **域名管理后台**（用于配置 DNS 记录）

---

## 🚀 步骤一：在 Railway 中添加自定义域名

### 1.1 登录 Railway 控制台

1. 打开浏览器，访问 [railway.app](https://railway.app)
2. 点击右上角 **Login** 登录你的账户
3. 进入你要绑定域名的 **项目（Project）**

### 1.2 进入服务设置

1. 在项目页面，点击你要绑定域名的 **服务（Service）**（通常是你的 web 应用）
2. 点击顶部的 **Settings（设置）** 标签页

### 1.3 添加自定义域名

1. 向下滚动找到 **Domains（域名）** 区域
2. 点击 **+ Custom Domain（添加自定义域名）**
3. 在弹出的输入框中，输入你购买的域名，例如：
   - `www.yourdomain.com`（推荐使用 www 子域名）
   - 或 `yourdomain.com`（裸域名/根域名）
4. 点击 **Add Domain（添加域名）**

### 1.4 获取 DNS 配置信息

添加域名后，Railway 会显示你需要配置的 DNS 记录信息：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| **CNAME** | `www` 或 `@` | `xxx.up.railway.app`（Railway 提供的地址） |

> ⚠️ **重要**：请复制或截图保存这个记录值，下一步需要用到！

---

## 🌐 步骤二：配置域名 DNS 解析

接下来需要在你购买域名的平台上配置 DNS 解析。以下是常见平台的操作方法：

### 2.1 阿里云（万网）配置方法

1. 登录 [阿里云控制台](https://dc.console.aliyun.com/)
2. 进入 **域名控制台** → 找到你的域名 → 点击 **解析**
3. 点击 **添加记录**
4. 填写以下信息：

| 字段 | 填写内容 |
|------|---------|
| 记录类型 | **CNAME** |
| 主机记录 | `www`（如果是裸域名则填 `@`） |
| 记录值 | Railway 提供的地址，如 `xxx.up.railway.app` |
| TTL | 默认 10 分钟即可 |

5. 点击 **确定** 保存

---

### 2.2 腾讯云（DNSPod）配置方法

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cns)
2. 进入 **域名管理** → 找到你的域名 → 点击 **解析**
3. 点击 **添加记录**
4. 填写以下信息：

| 字段 | 填写内容 |
|------|---------|
| 主机记录 | `www`（如果是裸域名则填 `@`） |
| 记录类型 | **CNAME** |
| 记录值 | Railway 提供的地址 |
| TTL | 默认 600 即可 |

5. 点击 **确认** 保存

---

### 2.3 Cloudflare 配置方法

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 选择你的域名 → 点击左侧 **DNS** → **Records（记录）**
3. 点击 **Add record（添加记录）**
4. 填写以下信息：

| 字段 | 填写内容 |
|------|---------|
| Type | **CNAME** |
| Name | `www`（如果是裸域名则填 `@`） |
| Target | Railway 提供的地址 |
| Proxy status | 建议选择 **DNS only（灰色云朵）** |

5. 点击 **Save** 保存

> 💡 **提示**：Cloudflare 的橙色云朵（Proxied）可能会导致 SSL 证书冲突，建议先用灰色云朵测试。

---

### 2.4 Spaceship 配置方法（推荐）

1. 打开浏览器，访问 [Spaceship 官网](https://www.spaceship.com/)
2. 点击右上角 **Log In** 登录你的账户
3. 登录后进入 **Domains（域名）** 页面
4. 找到你要配置的域名，点击进入域名详情
5. 点击左侧菜单的 **DNS** 选项
6. 在 DNS Records 区域，点击 **Add Record（添加记录）**
7. 填写以下信息：

| 字段 | 填写内容 |
|------|---------|
| Type | 选择 **CNAME** |
| Host | `www`（如果是裸域名则填 `@`） |
| Value | Railway 提供的地址，如 `xxx.up.railway.app` |
| TTL | 选择 **Auto** 或 **300**（5分钟） |

8. 点击 **Save（保存）** 按钮

> 💡 **提示**：Spaceship 的 DNS 变更通常在 5-15 分钟内生效，速度较快。

---

### 2.5 Namesilo / GoDaddy 等其他国际平台

配置逻辑类似：

1. 登录你的域名管理后台
2. 找到 **DNS Management** 或 **DNS Records**
3. 添加一条 **CNAME** 记录
4. Host/Name 填写 `www` 或 `@`
5. Value/Target 填写 Railway 提供的地址
6. 保存设置

---

## ⏳ 步骤三：等待 DNS 生效

配置完成后，需要等待 DNS 解析生效：

- **国内域名**：通常 5-10 分钟生效
- **国际域名**：可能需要 10-30 分钟
- **最长时间**：DNS 变更最多可能需要 24-48 小时全球生效

### 如何检查是否生效？

1. 回到 Railway 控制台的 **Settings → Domains** 区域
2. 查看你添加的域名状态：
   - ✅ **绿色勾号** = 配置成功
   - ⏳ **等待中** = DNS 还未生效，请耐心等待
   - ❌ **错误** = 配置有误，请检查 DNS 记录

### 在线检测工具

你也可以使用以下工具检测 DNS 是否生效：

- [DNS Checker](https://dnschecker.org/) - 检测全球 DNS 传播状态
- [whatsmydns.net](https://www.whatsmydns.net/) - 检测域名解析结果

---

## 🔒 步骤四：SSL 证书（HTTPS）

**好消息**：Railway 会自动为你的自定义域名申请和配置免费的 SSL 证书！

- 域名验证成功后，SSL 证书会在几分钟内自动签发
- 你无需手动操作，访问 `https://www.yourdomain.com` 即可看到安全锁标志

---

## ❓ 常见问题解答

### Q1: 裸域名（yourdomain.com）和 www 域名有什么区别？

| 类型 | 示例 | 说明 |
|------|------|------|
| 裸域名 | `yourdomain.com` | 不带 www 前缀 |
| www 域名 | `www.yourdomain.com` | 带 www 前缀 |

> 💡 **建议**：推荐使用 `www.yourdomain.com`，因为部分 DNS 服务商对裸域名的 CNAME 支持不完善。

---

### Q2: 如何同时支持裸域名和 www？

需要添加两条 DNS 记录：

1. **www 子域名**：CNAME → Railway 地址
2. **裸域名重定向**：
   - 方法一：在域名服务商设置 URL 转发（301 重定向）
   - 方法二：使用 Cloudflare 的页面规则进行重定向

---

### Q3: DNS 配置正确但 Railway 一直显示"等待中"？

可能的原因：
1. DNS 还未全球生效，请等待 10-30 分钟
2. 某些 DNS 服务商有缓存，尝试清除本地 DNS 缓存
3. 检查是否添加的记录类型正确（必须是 CNAME）

---

### Q4: 访问域名显示"无法访问此网站"？

排查步骤：
1. 检查 Railway 服务是否正常运行（非休眠状态）
2. 检查 DNS 记录值是否正确复制
3. 尝试使用 DNS Checker 检测解析是否生效
4. 清除浏览器缓存后重试

---

### Q5: Railway 免费版有什么限制？

Railway Hobby Plan 包含：
- 每月 $5 额度的免费使用量
- 支持自定义域名
- 自动 SSL 证书
- 注意：如果额度用完，服务会暂停

---

## 📝 快速检查清单

完成部署后，请确认以下内容：

- [ ] Railway 中已添加自定义域名
- [ ] 域名 DNS 已添加正确的 CNAME 记录
- [ ] Railway 域名状态显示绿色勾号
- [ ] 使用浏览器访问 `https://www.yourdomain.com` 正常
- [ ] 页面显示安全锁标志（HTTPS 生效）

---

## 🎉 完成！

恭喜你！现在你的应用已经可以通过自己的域名访问了！

如果在配置过程中遇到任何问题，可以：
1. 查看 [Railway 官方文档](https://docs.railway.app/guides/public-networking#custom-domains)
2. 在 Railway Discord 社区寻求帮助
3. 检查你的域名服务商的帮助文档

---

*最后更新：2024年12月*
