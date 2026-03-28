# Proposal: API 数据源支持

## Intent

为 InsightDash 添加 REST API 数据源支持，让用户可以从公开 API 获取数据，创建可视化图表。

## Scope

### In Scope
- 8 个内置 API 模板（天气/地理、统计/政府、实用工具）
- GET 请求 + JSON 解析
- responsePath 提取嵌套数据
- 测试连接功能
- 与现有 Dataset/Widget 架构集成

### Out of Scope
- POST 请求（Phase 2）
- 自定义 Headers（Phase 2）
- 用户自定义 URL（非模板，Phase 2）
- 定时刷新（Phase 2）
- 认证机制（OAuth/API Key）

## Approach

### 核心流程
```
用户选择模板 → 系统发起 GET 请求 → 解析 JSON → 推断列类型 → 存入 Dataset.schema
```

### 技术实现
- 使用 Node.js fetch API（内置）
- JSON 响应解析 + 类型推断（复用 CSV 解析逻辑）
- 支持 responsePath 提取嵌套数组
- 模板配置存储在 DataSource.config

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/workspaces/[...]/datasources/route.ts` | Modified | 添加 API 类型分支处理 |
| `src/lib/api-parser.ts` | New | API 请求 + JSON 解析器 |
| `src/components/datasource/api-upload-modal.tsx` | New | API 配置 UI 组件 |
| `src/app/(dashboard)/w/[slug]/datasources/page.tsx` | Modified | 添加"添加 API"按钮 |
| `src/lib/constants.ts` | New | API 模板常量定义 |

## Data Model

```typescript
// API DataSource Config
interface ApiDataSourceConfig {
  type: "API";
  url: string;
  method: "GET";
  responsePath?: string;  // 如 "results", "items"
  headers?: Record<string, string>;
  templateId?: string;    // 内置模板 ID
}

// 现有 Dataset.schema 格式复用
interface DatasetSchema {
  columns: { name: string; type: "string" | "number" | "date" }[];
  rows: Record<string, string | number>[];
  rowCount: number;
}
```

## Templates

| Category | Name | API | Response Path |
|----------|------|-----|--------------|
| 天气/地理 | 全球城市天气 | Open-Meteo | - |
| 天气/地理 | 世界各国信息 | RestCountries | - |
| 统计/政府 | GitHub 热门项目 | GitHub API | items |
| 统计/政府 | GitHub 单个项目 | GitHub API | - |
| 实用工具 | 随机用户 | RandomUser | results |
| 实用工具 | 狗狗品种列表 | Dog CEO | message |
| 实用工具 | 猫咪趣闻 | Cat Facts | - |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| API 限流 | Medium | 使用稳定、限流宽松的公开 API |
| 数据格式变化 | Low | 固定模板，提前验证 |
| CORS | Low | 所选 API 均支持 CORS |
| 网络超时 | Medium | 添加超时处理 + 用户提示 |

## Rollback Plan

删除新增文件 + 回退 route.ts 改动即可。无数据库迁移。

## Dependencies

无外部依赖。使用 Node.js 内置 fetch。

## Success Criteria

- [ ] 用户可在数据源列表页点击"添加 API"
- [ ] 可选择 8 个内置模板
- [ ] 点击测试连接可验证 API 可用
- [ ] 保存后数据存入 Dataset.schema
- [ ] 可在 Dashboard 创建基于 API 数据的图表
- [ ] 现有 CSV 功能不受影响
