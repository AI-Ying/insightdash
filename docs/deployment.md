# InsightDash 自动化部署指南

## 🎯 部署架构

采用 **Render Blueprint + GitHub Actions** 双保险自动化部署方案：

| 组件 | 服务 | 功能 |
|------|------|------|
| **Web 服务** | Render.com | 托管 Next.js 应用，自动部署 |
| **数据库** | Render PostgreSQL | 数据持久化 |
| **CI/CD** | GitHub Actions | 代码检查、测试、构建验证 |
| **监控** | Render Dashboard | 部署状态、日志、指标 |

## 🚀 快速部署

### 方式一：自动部署（推荐）

提交代码到 `master` 分支，自动触发部署：

```bash
git add .
git commit -m "feat: your changes"
git push origin master
```

Render 会自动检测到推送并部署最新代码。

### 方式二：部署脚本

使用本地部署脚本（包含测试和检查）：

```bash
./scripts/deploy.sh
```

### 方式三：手动部署

如需手动触发：

1. 推送代码到 GitHub
2. 访问 [Render Dashboard](https://dashboard.render.com)
3. 点击 "Manual Deploy" → "Deploy latest commit"

## 📁 部署配置

### 核心文件

| 文件 | 用途 |
|------|------|
| `render.yaml` | Render Blueprint 配置，定义服务和数据库 |
| `.github/workflows/ci-cd.yml` | GitHub Actions 工作流 |
| `vercel.json` | Vercel 部署配置（备选方案） |
| `scripts/deploy.sh` | 本地部署脚本 |

### 环境变量

在 Render Dashboard 中配置以下变量：

**必需：**

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `DATABASE_URL` | 数据库连接字符串 | Render 自动生成 |
| `NEXTAUTH_SECRET` | JWT 签名密钥 | Render 自动生成 |
| `NEXTAUTH_URL` | 应用公网地址 | `https://insightdash.onrender.com` |

**可选（OAuth）：**

| 变量 | 说明 |
|------|------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

## 🔧 初始设置

### 1. 连接 GitHub 仓库

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New +" → "Blueprint"
3. 选择 `AI-Ying/insightdash` 仓库
4. Render 自动读取 `render.yaml` 创建服务

### 2. 配置环境变量

在 Render Dashboard → insightdash → Environment 中设置：

```bash
NEXTAUTH_URL=https://insightdash.onrender.com
```

其他变量 Blueprint 已自动配置。

### 3. 首次部署

Blueprint 会自动执行：

1. 创建 PostgreSQL 数据库
2. 创建 Web Service
3. 运行 `npm install`
4. 生成 Prisma Client
5. 推送数据库 Schema
6. 构建 Next.js 应用
7. 启动服务

## 🔄 部署流程

### 自动部署触发条件

- ✅ 推送到 `master` 分支
- ✅ Pull Request 合并到 `master`
- ✅ 手动点击 "Manual Deploy"

### 部署流程图

```
Push to master
      ↓
GitHub Actions
├── Lint
├── Test
└── Build
      ↓
Render Webhook
      ↓
Render Deploy
├── npm install
├── prisma generate
├── prisma db push
└── next build
      ↓
Health Check (/api/health)
      ↓
Production ✅
```

## 🏥 健康检查

应用提供健康检查端点：

```bash
curl https://insightdash-faa2.onrender.com/api/health
```

响应示例：

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "api": "running"
  },
  "uptime": 3600
}
```

## 📊 监控与日志

### Render Dashboard

- **部署日志**: Dashboard → insightdash → Logs
- **性能指标**: Dashboard → insightdash → Metrics
- **环境变量**: Dashboard → insightdash → Environment

### 查看部署状态

```bash
# 检查应用状态
curl https://insightdash-faa2.onrender.com/api/health

# 查看 GitHub Actions 状态
# 访问: https://github.com/AI-Ying/insightdash/actions
```

## 🐛 故障排查

### 部署失败

1. **检查 GitHub Actions**: https://github.com/AI-Ying/insightdash/actions
2. **查看 Render 日志**: Dashboard → Logs
3. **常见原因**:
   - 环境变量缺失
   - 数据库连接失败
   - 构建命令错误

### 数据库迁移失败

```bash
# 手动推送 schema
npx prisma db push
```

### 应用无法启动

1. 检查环境变量是否正确设置
2. 确认 `NEXTAUTH_SECRET` 已生成
3. 查看 Render Logs 错误信息

## 📝 更新记录

### 2024-04-04 部署优化

- ✅ 添加 `render.yaml` Blueprint 配置
- ✅ 创建 GitHub Actions CI/CD 工作流
- ✅ 添加 `/api/health` 健康检查端点
- ✅ 创建 `scripts/deploy.sh` 部署脚本
- ✅ 配置自动部署

## 🔗 相关链接

- **生产环境**: https://insightdash-faa2.onrender.com
- **健康检查**: https://insightdash-faa2.onrender.com/api/health
- **Render Dashboard**: https://dashboard.render.com
- **GitHub 仓库**: https://github.com/AI-Ying/insightdash
- **GitHub Actions**: https://github.com/AI-Ying/insightdash/actions

## 💡 最佳实践

1. **总是通过 PR 合并代码**，不要直接推送到 master
2. **检查 CI/CD 状态** 后再合并 PR
3. **监控部署日志** 确保部署成功
4. **定期备份数据库**（免费 tier 30 天过期）
5. **使用健康检查端点** 监控应用状态

---

**注意**: Render 免费 tier 会在 15 分钟不活动后休眠，首次访问可能需要 ~50 秒启动。
