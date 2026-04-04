# Docker 部署指南

本文档介绍如何使用 Docker 部署 InsightDash 到生产环境。

## 目录

- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [Render 平台部署](#render-平台部署)
- [故障排查](#故障排查)

## 本地开发

### 使用 Docker Compose（推荐）

1. **启动开发环境**

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 数据库（端口 5432）
- Next.js 开发服务器（端口 3000）

2. **查看日志**

```bash
docker-compose logs -f app
docker-compose logs -f db
```

3. **停止服务**

```bash
docker-compose down
```

4. **完全重置（包括数据）**

```bash
docker-compose down -v
docker-compose up -d
```

### 环境变量

开发环境默认配置：

| 变量 | 值 | 说明 |
|------|-----|------|
| DATABASE_URL | postgresql://insightdash:insightdash_password@db:5432/insightdash | 数据库连接 |
| NEXTAUTH_URL | http://localhost:3000 | 认证回调地址 |
| NEXTAUTH_SECRET | local-development-secret-key | 认证密钥 |

### 数据库迁移

进入应用容器执行迁移：

```bash
docker-compose exec app npx prisma migrate dev
```

或仅生成客户端：

```bash
docker-compose exec app npx prisma generate
```

## 生产部署

### 构建生产镜像

1. **设置环境变量**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
```

2. **构建镜像**

```bash
docker build \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  -t insightdash:latest \
  .
```

> **注意**: `DATABASE_URL` 是必需的构建参数，用于在构建阶段执行 Prisma 数据库推送。

3. **运行容器**

```bash
docker run -d \
  --name insightdash \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e GITHUB_CLIENT_ID="your-github-id" \
  -e GITHUB_CLIENT_SECRET="your-github-secret" \
  --restart unless-stopped \
  insightdash:latest
```

### 多阶段构建说明

Dockerfile 包含三个阶段：

1. **Base 阶段**: 安装依赖，生成 Prisma Client
2. **Builder 阶段**: 构建 Next.js 应用，推送数据库变更
3. **Production 阶段**: 最小化生产镜像

生产镜像仅包含：
- Next.js 构建输出（`.next/`）
- Prisma Client 和 Schema
- 生产依赖（`npm ci --omit=dev`）
- 静态资源（`public/`）

### 健康检查

容器内置健康检查：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
```

检查容器健康状态：

```bash
docker inspect --format='{{.State.Health.Status}}' insightdash
```

## Render 平台部署

### 使用 Blueprint 部署（推荐）

项目已配置 `render.yaml`，支持一键部署：

1. **Fork 或推送代码到 GitHub**

2. **在 Render 创建 Blueprint**
   - 访问 [Render Dashboard](https://dashboard.render.com)
   - 点击 "Blueprints"
   - 选择你的 GitHub 仓库
   - Render 会自动读取 `render.yaml`

3. **配置环境变量**

在 Render Dashboard 设置以下 Secrets：

| 变量 | 必需 | 说明 |
|------|------|------|
| DATABASE_URL | 是 | 由 Render PostgreSQL 自动提供 |
| NEXTAUTH_SECRET | 是 | 自动生成或手动设置 |
| NEXTAUTH_URL | 是 | 你的 Render 域名 |
| GITHUB_CLIENT_ID | 否 | GitHub OAuth |
| GITHUB_CLIENT_SECRET | 否 | GitHub OAuth |

4. **自动部署**

每次推送到 `master` 分支，Render 会自动：
- 构建 Docker 镜像
- 运行数据库迁移
- 部署新版本
- 执行健康检查

### 手动部署到 Render

如果你不想使用 Blueprint：

1. **创建 Web Service**
   - 类型: Docker
   - 根目录: `./`

2. **配置构建命令**

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

3. **配置启动命令**

```bash
npm start
```

4. **设置健康检查路径**

```
/api/health
```

## 故障排查

### 数据库连接失败

**症状**: 容器启动失败，日志显示数据库连接错误

**解决**:
1. 检查 `DATABASE_URL` 格式
2. 确认数据库容器正在运行: `docker-compose ps`
3. 检查网络连接: `docker-compose exec app ping db`

### Prisma Client 未生成

**症状**: 应用启动报错 "Prisma Client 未找到"

**解决**:
```bash
docker-compose exec app npx prisma generate
docker-compose restart app
```

### 构建失败 - 内存不足

**症状**: Docker 构建过程中 Node.js 内存溢出

**解决**:
增加 Docker 内存限制或在构建命令中添加：

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 静态资源 404

**症状**: CSS/JS 文件返回 404

**解决**:
1. 确认 `next.config.mjs` 配置正确
2. 检查 `.next/static` 是否在镜像中
3. 重新构建镜像

### 端口冲突

**症状**: `bind: address already in use`

**解决**:
```bash
# 查找占用 3000 端口的进程
lsof -i :3000
# 或修改 docker-compose.yml 使用其他端口
ports:
  - "3001:3000"
```

## 最佳实践

1. **不要在镜像中存储敏感信息**
   - 使用环境变量注入 Secrets
   - `.env` 文件已加入 `.dockerignore`

2. **数据库迁移策略**
   - 开发环境: `prisma db push`
   - 生产环境: `prisma migrate deploy`

3. **日志管理**
   ```bash
   # 查看最近 100 行日志
   docker-compose logs --tail=100 app
   
   # 导出日志
   docker-compose logs app > app.log
   ```

4. **镜像优化**
   - 使用 `.dockerignore` 减少构建上下文
   - 多阶段构建减小最终镜像体积
   - 定期清理旧镜像: `docker image prune -a`

## 参考

- [Next.js Docker 部署文档](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [Render Blueprint 文档](https://render.com/docs/blueprint-spec)
