# Design: API 数据源支持

## Technical Approach

### Architecture
```
User → API Upload Modal → POST /api/datasources (type=API)
                                  ↓
                            api-parser.ts
                            (fetch + parse)
                                  ↓
                            Dataset.schema
                                  ↓
                            Dashboard Widget
```

### Key Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/api-parser.ts` | Create | API fetch + JSON parse + type inference |
| `src/lib/constants.ts` | Create | API templates constant |
| `src/app/api/.../datasources/route.ts` | Modify | Add API type branch |
| `src/components/datasource/api-upload-modal.tsx` | Create | Modal UI component |

## API Parser Implementation

```typescript
// src/lib/api-parser.ts

export interface ApiConfig {
  url: string;
  method: "GET";
  responsePath?: string;
  headers?: Record<string, string>;
}

export interface ApiResult {
  columns: { name: string; type: "string" | "number" | "date" }[];
  rows: Record<string, string | number>[];
  rowCount: number;
}

/**
 * Fetch data from API and parse into Dataset format
 */
export async function fetchApiData(config: ApiConfig): Promise<ApiResult> {
  const response = await fetch(config.url, {
    method: config.method,
    headers: {
      "Accept": "application/json",
      ...config.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  let json = await response.json();

  // Extract nested array if responsePath provided
  if (config.responsePath) {
    json = getNestedValue(json, config.responsePath);
  }

  // Ensure array
  if (!Array.isArray(json)) {
    json = [json];
  }

  // Infer columns and types
  const columns = inferColumns(json);
  const rows = json.slice(0, 10000); // Limit to 10k rows

  return {
    columns,
    rows,
    rowCount: json.length,
  };
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    // Handle array index like "items[0]"
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      current = current[match[1]][parseInt(match[2])];
    } else {
      current = current[part];
    }
    if (current === undefined) break;
  }
  return current;
}

/**
 * Infer columns from array of objects
 */
function inferColumns(data: any[]): { name: string; type: "string" | "number" | "date" }[] {
  if (data.length === 0) return [];
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  
  return keys.map(name => ({
    name,
    type: inferType(data, name),
  }));
}

/**
 * Infer type of a column by sampling rows
 */
function inferType(data: any[], key: string): "string" | "number" | "date" {
  let numCount = 0;
  let dateCount = 0;
  const sampleSize = Math.min(data.length, 100);
  
  for (let i = 0; i < sampleSize; i++) {
    const val = data[i][key];
    if (val === null || val === undefined) continue;
    
    const strVal = String(val);
    if (!isNaN(Number(val)) && strVal.trim() !== "") {
      numCount++;
    }
    if (!isNaN(Date.parse(val)) && strVal.length > 5) {
      dateCount++;
    }
  }
  
  const threshold = sampleSize * 0.6;
  if (numCount > threshold) return "number";
  if (dateCount > threshold) return "date";
  return "string";
}
```

## API Templates

```typescript
// src/lib/constants.ts

export const API_TEMPLATES = [
  // Weather & Geography
  {
    id: "weather-beijing",
    category: "天气/地理",
    name: "全球城市天气",
    description: "实时天气数据",
    url: "https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    method: "GET" as const,
    responsePath: "",
  },
  {
    id: "world-countries",
    category: "天气/地理",
    name: "世界各国信息",
    description: "200+国家的人口、面积、地区",
    url: "https://restcountries.com/v3.1/all?fields=name,population,area,region,capital",
    method: "GET" as const,
    responsePath: "",
  },
  // Statistics & Government
  {
    id: "github-trending",
    category: "统计/政府",
    name: "GitHub 热门项目",
    description: "按 star 排序的热门仓库",
    url: "https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=20",
    method: "GET" as const,
    responsePath: "items",
  },
  {
    id: "github-repo",
    category: "统计/政府",
    name: "GitHub 单个项目详情",
    description: "如 Facebook React 项目统计",
    url: "https://api.github.com/repos/facebook/react",
    method: "GET" as const,
    responsePath: "",
  },
  // Utilities
  {
    id: "random-users",
    category: "实用工具",
    name: "随机用户",
    description: "100条随机用户数据",
    url: "https://randomuser.me/api/?results=100",
    method: "GET" as const,
    responsePath: "results",
  },
  {
    id: "dog-breeds",
    category: "实用工具",
    name: "狗狗品种列表",
    description: "各品种狗狗信息",
    url: "https://dog.ceo/api/breeds/list/all",
    method: "GET" as const,
    responsePath: "message",
  },
  {
    id: "cat-facts",
    category: "实用工具",
    name: "猫咪趣闻",
    description: "随机猫咪冷知识",
    url: "https://catfact.ninja/fact",
    method: "GET" as const,
    responsePath: "",
  },
];
```

## DataSource Config Format

```typescript
// Stored in DataSource.config as JSON
{
  type: "API",
  templateId: "random-users",
  url: "https://randomuser.me/api/?results=100",
  method: "GET",
  responsePath: "results",
  fetchedAt: "2026-03-28T12:00:00Z"  // For cache invalidation
}
```

## Open Questions

- Should we cache API responses? (Phase 2)
- Should we support API key authentication? (Phase 2)

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | api-parser.ts | Jest mock fetch |
| Integration | API route | Manual with real API calls |
| E2E | Full flow | Manual with browser |

## Rollback Plan

Delete new files + revert route.ts changes. No database migration needed.
