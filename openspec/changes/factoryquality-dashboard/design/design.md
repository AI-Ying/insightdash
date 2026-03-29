# Design: 工厂质量分析 Dashboard

## Technical Approach

### Architecture
```
CSV/API → quality-parser → Dataset.schema → Dashboard Widgets
```

### Data Flow
1. User imports CSV sample data
2. System parses quality records
3. Dashboard aggregates by workshop/line/device
4. Widgets display KPIs, charts, alerts

## Sample Data

```csv
timestamp,workshop,line,device,total,good,defect,defect_code
2026-03-29 08:00,压铸车间,压铸岛1,压铸机01,100,97,3,P01
2026-03-29 08:00,压铸车间,压铸岛1,压铸机02,95,92,3,P02
2026-03-29 08:00,压铸车间,压铸岛2,压铸机03,98,96,2,P01
2026-03-29 08:00,质检车间,X-ray线1,X-ray01,50,48,2,P03
2026-03-29 08:00,质检车间,光学线1,光学01,45,44,1,P04
2026-03-29 08:00,质检车间,蓝光线1,蓝光01,30,29,1,P05
```

## Key Files

| File | Description |
|------|-------------|
| `src/lib/quality-parser.ts` | Parse quality CSV, aggregate by dimensions |
| `src/app/(dashboard)/w/[slug]/quality/page.tsx` | Quality dashboard page |
| `src/components/charts/quality-kpi-card.tsx` | KPI metric card |
| `src/components/charts/quality-trend-chart.tsx` | 24h trend line chart |
| `src/components/charts/quality-ranking.tsx` | Workshop/line ranking |
| `src/components/charts/quality-alert-list.tsx` | Alert list with rules |

## Quality Parser

```typescript
// src/lib/quality-parser.ts

export interface QualityRecord {
  timestamp: string;
  workshop: string;
  line: string;
  device: string;
  total: number;
  good: number;
  defect: number;
  defectCode: string;
}

export interface AggregatedMetrics {
  workshop: string;
  line?: string;
  device?: string;
  total: number;
  good: number;
  defect: number;
  goodRate: number;
  defectRate: number;
}

export interface Alert {
  timestamp: string;
  workshop: string;
  line: string;
  device: string;
  type: "warning" | "critical";
  message: string;
  value: number;
}

/**
 * Parse quality CSV into records
 */
export function parseQualityCSV(csvText: string): QualityRecord[] {
  // Parse CSV, return array of QualityRecord
}

/**
 * Aggregate metrics by workshop/line/device
 */
export function aggregateByWorkshop(records: QualityRecord[]): AggregatedMetrics[]

/**
 * Calculate 24h trend
 */
export function calculate24hTrend(records: QualityRecord[]): { hour: string; goodRate: number }[]

/**
 * Check alert rules
 */
export function checkAlerts(records: QualityRecord[], prevRecords: QualityRecord[]): Alert[]

/**
 * Alert rules
 */
const ALERT_RULES = [
  { name: "良品率低", condition: (rate) => rate < 0.95, severity: "warning" },
  { name: "良品率严重", condition: (rate) => rate < 0.90, severity: "critical" },
];
```

## UI Components

### QualityKPICard
```tsx
interface Props {
  title: string;
  value: number;
  unit: string;
  trend?: number; // positive/negative/zero
  severity?: "normal" | "warning" | "critical";
}
```

### QualityTrendChart
```tsx
// Line chart showing 24h trend
// X-axis: hours
// Y-axis: good rate percentage
```

### QualityRanking
```tsx
// Bar chart showing workshop/line ranked by defect count
// Sorted by worst first
```

### QualityAlertList
```tsx
// List of alerts with severity icon, timestamp, location, message
// Click to navigate to device
```

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ 质量监控大屏          [压铸车间 ▼] [质检车间 ▼]         │
├─────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │良品率  │ │不良数  │ │告警数  │ │OEE    │           │
│ │ 97.2% │ │  23件  │ │   2条  │ │ 88.5% │           │
│ │ ↑0.5% │ │ ↓3件   │ │ ⚠️    │ │ ↓1.2% │           │
│ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │           良品率趋势 (24h)                       │   │
│ │           ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌────────────────────┐  ┌────────────────────┐         │
│ │ 车间排名          │  │ 不良类型分布        │         │
│ │ 压铸岛1  96.5%  │  │ 气孔  ████████ 45% │         │
│ │ 压铸岛2  97.8%  │  │ 裂纹  ████░░░░ 30% │         │
│ │ X-ray线  98.2%  │  │ 变形  ███░░░░░ 25% │         │
│ └────────────────────┘  └────────────────────┘         │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 告警列表                                        │   │
│ │ ⚠️ 13:05 压铸岛1 良品率 < 95% (93.2%)          │   │
│ │ ⚠️ 12:30 质检线2 连续3件 X-ray 缺陷            │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Open Questions

- Real-time MQTT vs CSV (Phase 1 MVP uses CSV)
- Notification delivery (Phase 2)
- Historical analysis (Phase 2)

## Rollback Plan

Delete new files + revert workspace page changes. No database migration.
