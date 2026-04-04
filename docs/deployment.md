# InsightDash 自动化部署指南

## 🎯 部署架构

采用 **Render Blueprint + GitHub Actions + Docker** 自动化部署方案：

| 组件 | 服务 | 功能 |
|------|------|------|
| **Web 服务** | Render.com | 托管 Next.js 应用，自动部署 |
| **数据库** | Render PostgreSQL | 数据持久化 |
| **CI/CD** | GitHub Actions | 代码检查、测试、Docker 构建、部署 |
| **容器镜像** | GitHub Container Registry | Docker 镜像存储 |
| **监控** | Render Dashboard | 部署状态、日志、指标 |

## 🚀 部署方式

### 方式一：自动部署（推荐）

提交代码到 `master` 分支，自动触发完整 CI/CD：

```bash
git add .
git commit -m "feat: your changes"
git push origin master
```

流程：
1. GitHub Actions 运行测试和构建
2. 构建 Docker 镜像并推送到 GHCR
3. 自动触发 Render 部署
4. 执行健康检查验证

### 方式二：Docker 部署

使用 Docker 本地构建和部署：

```bash
# 1. 构建镜像
docker build \
  --build-arg DATABASE_URL="postgresql://..." \
  -t insightdash:latest .

# 2. 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  insightdash:latest
```

详细指南：[Docker 部署指南](./docker/deployment-guide.md)

### 方式三：Docker Compose（本地开发）

```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 方式四：部署脚本

使用本地部署脚本：

```bash
./scripts/deploy.sh
```

## 📁 部署配置

### 核心文件

| 文件 | 用途 |
|------|------|
| `Dockerfile` | 多阶段 Docker 构建配置 |
| `docker-compose.yml` | 本地开发环境 |
| `.dockerignore` | Docker 构建排除文件 |
| `render.yaml` | Render Blueprint 配置 |
| `.github/workflows/ci-cd.yml` | GitHub Actions 工作流 |
| `docs/docker/deployment-guide.md` | Docker 部署详细指南 |

### 环境变量

在 Render Dashboard 或 GitHub Secrets 中配置：

**必需：**

| 变量 | 说明 | 位置 |
|------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | Render（自动生成）/ GitHub Secrets |
| `NEXTAUTH_SECRET` | JWT 签名密钥 | Render（自动生成） |
| `NEXTAUTH_URL` | 应用公网地址 | Render |

**GitHub Actions Secrets：**

| Secret | 说明 |
|--------|------|
| `RENDER_API_TOKEN` | Render API 令牌 |
| `RENDER_SERVICE_ID_STAGING` | 预发布环境服务 ID |
| `RENDER_SERVICE_ID_PRODUCTION` | 生产环境服务 ID |

**可选（OAuth）：**

| 变量 | 说明 |
|------|------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret |

## 🔧 初始设置

### 1. 设置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加：

```
RENDER_API_TOKEN=your_render_api_token
RENDER_SERVICE_ID_STAGING=your_staging_service_id
RENDER_SERVICE_ID_PRODUCTION=your_production_service_id
DATABASE_URL=your_database_url  # 用于 Docker 构建
```

获取 Render API Token：
- 访问 [Render Account Settings](https://dashboard.render.com/u/settings)
- 生成 API Key

### 2. 连接 GitHub 仓库到 Render

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New +" → "Blueprint"
3. 选择 `AI-Ying/insightdash` 仓库
4. Render 自动读取 `render.yaml` 创建服务

### 3. 配置环境变量

在 Render Dashboard → insightdash → Environment 中确认：

```bash
NEXTAUTH_URL=https://insightdash.onrender.com
```

### 4. 首次部署

Blueprint 会自动执行：

1. 创建 PostgreSQL 数据库
2. 创建 Web Service
3. 运行 `npm install`
4. 生成 Prisma Client
5. 推送数据库 Schema
6. 构建 Next.js 应用
7. 启动服务

## 🔄 部署流程

### 多环境部署

| 分支 | 环境 | URL |
|------|------|-----|
| `staging` | 预发布 | Staging URL |
| `master`/`main` | 生产 | Production URL |

### CI/CD 流程图

```
Push to master/staging
       ↓
GitHub Actions
├── Lint
├── Test
├── Build App
├── Build Docker Image
└── Push to GHCR
       ↓
Deploy Job
├── Trigger Render Deploy
├── Wait for Deployment
└── Health Check
       ↓
Production ✅
```

## 🏥 健康检查

应用提供健康检查端点：

```bash
curl https://your-app.onrender.com/api/health
```

响应示例：

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "insightdash"
}
```

容器内置健康检查，自动重启不健康的实例。

## 📊 监控与日志

### Render Dashboard

- **部署日志**: Dashboard → insightdash → Logs
- **性能指标**: Dashboard → insightdash → Metrics
- **环境变量**: Dashboard → insightdash → Environment

### GitHub Actions

- **构建状态**: https://github.com/AI-Ying/insightdash/actions
- **容器镜像**: https://github.com/AI-Ying/insightdash/pkgs/container/insightdash

### 查看部署状态

```bash
# 检查应用状态
curl https://your-app.onrender.com/api/health

# 查看 GitHub Actions 状态
# 访问: https://github.com/AI-Ying/insightdash/actions
```

## 🐛 故障排查

### 部署失败

1. **检查 GitHub Actions**: https://github.com/AI-Ying/insightdash/actions
2. **查看 Render 日志**: Dashboard → Logs
3. **检查 Docker 构建**: GitHub Actions → build-and-push-docker 任务
4. **常见原因**:
   - 环境变量缺失
   - 数据库连接失败
   - Docker 构建错误

### Docker 构建失败

```bash
# 本地测试构建
docker build --build-arg DATABASE_URL="postgresql://..." -t insightdash:test .

# 查看构建日志
docker build --progress=plain ...
```

### 数据库迁移失败

```bash
# 手动推送 schema
npx prisma db push
```

### 应用无法启动

1. 检查环境变量是否正确设置
2. 确认 `NEXTAUTH_SECRET` 已生成
3. 查看 Render Logs 错误信息
4. 检查健康检查端点返回

## 📝 更新记录

### 2024-04-04 自动化部署升级

- ✅ 添加 `Dockerfile` 多阶段构建
- ✅ 添加 `docker-compose.yml` 本地开发
- ✅ 添加 `.dockerignore` 优化构建
- ✅ 升级 GitHub Actions 支持 Docker 构建
- ✅ 添加多环境部署（staging/production）
- ✅ 添加健康检查端点 `/api/health`
- ✅ 添加自动部署触发和健康检查
- ✅ 创建 Docker 部署详细指南

## 🔗 相关链接

- **生产环境**: https://insightdash-faa2.onrender.com
- **健康检查**: https://insightdash-faa2.onrender.com/api/health
- **Render Dashboard**: https://dashboard.render.com
- **GitHub 仓库**: https://github.com/AI-Ying/insightdash
- **GitHub Actions**: https://github.com/AI-Ying/insightdash/actions
- **容器镜像**: https://github.com/AI-Ying/insightdash/pkgs/container/insightdash
- **Docker 部署指南**: ./docker/deployment-guide.md

## 💡 最佳实践

1. **总是通过 PR 合并代码**，不要直接推送到 master
2. **检查 CI/CD 状态** 后再合并 PR
3. **监控部署日志** 确保部署成功
4. **定期备份数据库**（免费 tier 30 天过期）
5. **使用健康检查端点** 监控应用状态
6. **使用 staging 环境** 测试变更后再部署到生产

---

**注意**: Render 免费 tier 会在 15 分钟不活动后休眠，首次访问可能需要 ~50 秒启动。
