# InsightDash

开源 BI 数据分析仪表板 SaaS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

## 功能特性

- 📊 **多图表支持** - Line、Bar、Area、Pie、KPI Card
- 📁 **多数据源** - CSV 上传、API 接入
- 🔒 **多租户** - 基于 Workspace 的数据隔离
- 👥 **团队协作** - 成员管理和权限控制
- 🎨 **工厂质量大屏** - 良品率监控、告警、产线下钻
- 📈 **历史分析** - 日/周/月趋势、班次对比

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

### 安装

```bash
# 克隆项目
git clone https://github.com/AI-Ying/insightdash.git
cd insightdash

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写数据库和 OAuth 配置

# 初始化数据库
pnpm db:push

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### Docker 部署

```bash
docker-compose up -d
```

## 环境变量

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth (可选)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 | 框架 |
| React 19 | UI |
| TypeScript 5.8 | 类型系统 |
| Prisma | ORM |
| PostgreSQL | 数据库 |
| Tailwind CSS 4 | 样式 |
| ECharts 5 | 图表 |
| NextAuth v5 | 认证 |

## 项目结构

```
insightdash/
├── prisma/
│   └── schema.prisma    # 数据库 Schema
├── public/
│   └── sample/          # 示例数据
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (auth)/     # 认证页面
│   │   ├── (dashboard)/ # 仪表板页面
│   │   └── api/        # API Routes
│   ├── components/      # React 组件
│   │   ├── charts/     # 图表组件
│   │   ├── dashboard/  # 仪表板组件
│   │   ├── datasource/ # 数据源组件
│   │   └── layout/     # 布局组件
│   └── lib/            # 工具库
│       ├── auth.ts      # NextAuth 配置
│       ├── csv-parser.ts # CSV 解析
│       └── quality-parser.ts # 质量数据解析
├── openspec/            # SDD 文档
└── docs/               # 部署文档
```

## API 文档

### 数据源

```
GET    /api/workspaces/:id/datasources      # 获取数据源列表
POST   /api/workspaces/:id/datasources      # 创建数据源
DELETE /api/workspaces/:id/datasources/:id  # 删除数据源
GET    /api/workspaces/:id/datasets         # 获取数据集
POST   /api/workspaces/:id/datasets          # 创建数据集
GET    /api/workspaces/:id/datasets/:id/data # 获取数据
```

### 仪表板

```
GET    /api/workspaces/:id/dashboards       # 获取仪表板列表
POST   /api/workspaces/:id/dashboards       # 创建仪表板
GET    /api/workspaces/:id/dashboards/:id   # 获取仪表板详情
PATCH  /api/workspaces/:id/dashboards/:id   # 更新仪表板
DELETE /api/workspaces/:id/dashboards/:id   # 删除仪表板

# 组件
POST   /api/workspaces/:id/dashboards/:id/widgets    # 添加组件
PATCH  /api/workspaces/:id/dashboards/:id/widgets/:wid  # 更新组件
DELETE /api/workspaces/:id/dashboards/:id/widgets/:wid  # 删除组件
```

## 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

## 部署

详见 [docs/deployment.md](./docs/deployment.md)

推荐部署平台：
- [Render](https://render.com) - 免费 tier 支持
- [Vercel](https://vercel.com) - Next.js 官方
- [Railway](https://railway.app) - 简单易用

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
