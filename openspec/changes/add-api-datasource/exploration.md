# Exploration: API 数据源支持

## 当前状态

### 已实现
- ✅ CSV 上传 → PapaParse 解析 → Dataset.schema(JSON) 存储
- ✅ Schema 格式：`{ columns: [{name, type}], rows: [{...}], rowCount }`

### 数据流
```
CSV 文件 → Papa.parse() → { columns, rows } → Dataset.schema (JSON) → Widget 读取
```

---

## 目标

支持从 **REST API** 获取数据，复用现有 Dataset/Widget 架构。

---

## 受影响区域

| 文件 | 改动 | 说明 |
|------|------|------|
| `src/app/api/workspaces/[workspaceId]/datasources/route.ts` | 大改 | 添加 API 类型分支 |
| `src/components/datasource/` | 新增 | API 数据源配置组件 |
| `src/app/(dashboard)/w/[slug]/datasources/page.tsx` | 中改 | 添加"添加 API"按钮 |
| `src/lib/api-parser.ts` | 新增 | API 响应解析器 |
| `prisma/schema.prisma` | 小改 | DataSource.type 已有 API 枚举值 |

---

## 内置模板数据源

### 1. 天气/地理（Weather & Geography）

| 模板 | API | 数据 |
|------|-----|------|
| **全球城市天气** | Open-Meteo | `{temperature, humidity, wind_speed, weather_code}` |
| **国家列表** | RestCountries | `{name, population, area, region, capital}` |

**示例 URL**：
```
https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m
https://restcountries.com/v3.1/all?fields=name,population,area,region,capital
```

### 2. 统计/政府公开数据（Statistics & Government）

| 模板 | API | 数据 |
|------|-----|------|
| **世界人口统计** | WorldBank | `{country, year, population, GDP}` |
| **GitHub 开源项目** | GitHub API | `{name, stars, forks, issues, language}` |

**示例 URL**：
```
https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=100
https://api.github.com/repos/facebook/react
https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=20
```

### 3. 实用工具（Utilities）

| 模板 | API | 数据 |
|------|-----|------|
| **随机用户** | RandomUser | `{name, age, gender, email, city, country, picture}` |
| **狗狗品种** | Dog CEO | `{breed, weight, height, life_span}` |
| **猫咪趣闻** | Cat Facts | `{fact, length}` |

**示例 URL**：
```
https://randomuser.me/api/?results=100
https://dog.ceo/api/breeds/list/all
https://catfact.ninja/fact
```

---

## 完整模板列表（8个）

```typescript
const API_TEMPLATES = [
  // 天气/地理
  {
    category: "天气/地理",
    name: "全球城市天气",
    description: "实时天气数据",
    url: "https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    method: "GET",
    responsePath: "",
  },
  {
    category: "天气/地理",
    name: "世界各国信息",
    description: "200+国家的人口、面积、地区",
    url: "https://restcountries.com/v3.1/all?fields=name,population,area,region,capital",
    method: "GET",
    responsePath: "",
  },
  
  // 统计/政府
  {
    category: "统计/政府",
    name: "GitHub 热门项目",
    description: "按 star 排序的热门仓库",
    url: "https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=20&per_page=20",
    method: "GET",
    responsePath: "items",
  },
  {
    category: "统计/政府",
    name: "GitHub 单个项目详情",
    description: "如 Facebook React 项目统计",
    url: "https://api.github.com/repos/facebook/react",
    method: "GET",
    responsePath: "",
  },
  
  // 实用工具
  {
    category: "实用工具",
    name: "随机用户",
    description: "100条随机用户数据",
    url: "https://randomuser.me/api/?results=100",
    method: "GET",
    responsePath: "results",
  },
  {
    category: "实用工具",
    name: "狗狗品种列表",
    description: "各品种狗狗信息",
    url: "https://dog.ceo/api/breeds/list/all",
    method: "GET",
    responsePath: "message",
  },
  {
    category: "实用工具",
    name: "猫咪趣闻",
    description: "随机猫咪冷知识",
    url: "https://catfact.ninja/fact",
    method: "GET",
    responsePath: "",
  },
];
```

---

## UI 设计

### 数据源列表页新增按钮
- 上传 CSV（现有）
- 添加 API 数据源（新增）

### API 配置 Modal
```
┌─────────────────────────────────────┐
│ 添加 API 数据源                      │
├─────────────────────────────────────┤
│ 模板选择：                           │
│ [随机用户        ▼]                  │
│                                      │
│ 或自定义：                           │
│ URL: [https://...]                  │
│ Method: [GET ▼]                     │
│ Response Path: [results]            │
│                                      │
│ [测试连接]                           │
│                                      │
│  [取消]              [保存]           │
└─────────────────────────────────────┘
```

---

## 难度分析

| 功能 | 复杂度 | 说明 |
|------|--------|------|
| GET 请求 + JSON 解析 | 低 | 基础 fetch |
| responsePath 提取 | 中 | 支持嵌套如 `items[0].data` |
| 认证头（GitHub） | 低 | 公开数据无需认证 |
| 分页/大数据量 | 中 | GitHub API 分页 |
| 定时刷新 | 高 | 轮询机制 |

---

## 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| API 限流 | 中 | GitHub 60 req/hr（未认证）|
| 数据格式变化 | 低 | 固定模板，字段映射 |
| CORS | 低 | 这些 API 都支持 CORS |

---

## 实施计划

### Phase 1: MVP（1-2天）
- ✅ 8 个内置模板
- ✅ GET 请求
- ✅ JSON 自动解析 + 类型推断
- ✅ responsePath 提取
- ✅ 测试连接功能

### Phase 2: 增强（2-3天）
- ✅ 自定义 Headers
- ✅ POST 请求支持
- ✅ 用户自定义 URL（非模板）
- ✅ 定时刷新配置

---

## Ready for Proposal

**是** — 可以进入 sdd-propose 阶段。

确认数据源后，我将输出正式提案。
