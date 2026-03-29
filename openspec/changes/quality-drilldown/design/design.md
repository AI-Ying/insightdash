# Design: 产线数据分析 & 历史数据分析

---

## 1. Component Structure

```
quality/
├── page.tsx                    # 主页面（下钻入口）
├── history/page.tsx           # 历史分析页
└── components/
    ├── DrillDownNav.tsx       # 层级导航
    ├── DeviceDetailPanel.tsx # 设备详情侧边栏
    ├── TimeRangeSelector.tsx  # 时间选择器
    ├── TrendChart.tsx         # 趋势图（折线）
    └── ShiftChart.tsx         # 班次对比（柱状）
```

---

## 2. URL Design

| 页面 | URL | 说明 |
|------|-----|------|
| 质量大屏 | `/quality` | 默认全厂视图 |
| 车间下钻 | `/quality?workshop=压铸车间` | 筛选到车间 |
| 产线下钻 | `/quality?workshop=压铸车间&line=压铸岛1` | 筛选到产线 |
| 历史分析 | `/quality/history` | 历史趋势 |
| 历史+时间 | `/quality/history?range=today` | 带时间范围 |

---

## 3. DrillDownNav Component

```tsx
interface DrillDownNavProps {
  workshop?: string;
  line?: string;
  device?: string;
  onNavigate: (level: "factory" | "workshop" | "line" | "device", value?: string) => void;
}

// Usage
<DrillDownNav
  workshop="压铸车间"
  line="压铸岛1"
  onNavigate={(level, value) => {
    if (level === "factory") router.push("/quality");
    if (level === "workshop") router.push(`/quality?workshop=${value}`);
    if (level === "line") router.push(`/quality?workshop=${workshop}&line=${value}`);
  }}
/>

// Renders: 全厂 > 压铸车间 > 压铸岛1
// Each segment is clickable except current
```

---

## 4. DeviceDetailPanel Component

```tsx
interface DeviceDetailPanelProps {
  device: string;
  workshop: string;
  line: string;
  open: boolean;
  onClose: () => void;
}

// Panel slides in from right (fixed width 400px)
// Shows:
// - Device header with close button
// - Current shift metrics (total/good/defect/rate)
// - Defect breakdown pie chart
// - Recent defect records table
// - Parameter trends (if available)
```

---

## 5. TimeRangeSelector Component

```tsx
interface TimeRangeSelectorProps {
  value: "today" | "week" | "month" | "lastMonth" | "custom";
  customRange?: { start: string; end: string };
  onChange: (range: TimeRange) => void;
}

// Options:
// - 今日: today
// - 本周: current week (Mon-Sun)
// - 本月: current month
// - 上月: last month
// - 自定义: shows date pickers
```

---

## 6. Data Parser Functions

```typescript
// quality-parser.ts additions

/**
 * Determine shift from timestamp
 */
export function parseShift(timestamp: string): "白班" | "夜班" {
  const hour = new Date(timestamp).getHours();
  return hour >= 8 && hour < 20 ? "白班" : "夜班";
}

/**
 * Extract date part (YYYY-MM-DD)
 */
export function parseDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

/**
 * Calculate week identifier (YYYY-Www)
 */
export function parseWeek(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

/**
 * Extract month (YYYY-MM)
 */
export function parseMonth(timestamp: string): string {
  return timestamp.slice(0, 7);
}

/**
 * Aggregate by shift
 */
export function aggregateByShift(records: QualityRecord[]): ShiftMetrics[] {
  const shifts = { 白班: { total: 0, good: 0, defect: 0 }, 夜班: { total: 0, good: 0, defect: 0 } };
  
  for (const r of records) {
    const shift = parseShift(r.timestamp);
    shifts[shift].total += r.total;
    shifts[shift].good += r.good;
    shifts[shift].defect += r.defect;
  }
  
  return Object.entries(shifts).map(([shift, data]) => ({
    shift: shift as "白班" | "夜班",
    ...data,
    goodRate: data.total > 0 ? (data.good / data.total) * 100 : 0
  }));
}

/**
 * Aggregate by day
 */
export function aggregateByDay(records: QualityRecord[]): DailyMetrics[] {
  const map = new Map<string, { total: number; good: number; defect: number }>();
  
  for (const r of records) {
    const date = parseDate(r.timestamp);
    const existing = map.get(date) || { total: 0, good: 0, defect: 0 };
    map.set(date, {
      total: existing.total + r.total,
      good: existing.good + r.good,
      defect: existing.defect + r.defect
    });
  }
  
  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    ...data,
    goodRate: data.total > 0 ? (data.good / data.total) * 100 : 0
  })).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate by week
 */
export function aggregateByWeek(records: QualityRecord[]): WeeklyMetrics[] {
  // Similar to daily, but grouped by week
}

/**
 * Aggregate by month
 */
export function aggregateByMonth(records: QualityRecord[]): MonthlyMetrics[] {
  // Similar to daily, but grouped by month
}
```

---

## 7. Historical Trend Chart

```tsx
// TrendChart.tsx using ECharts
interface TrendChartProps {
  data: DailyMetrics[] | WeeklyMetrics[] | MonthlyMetrics[];
  granularity: "day" | "week" | "month";
  height?: number;
}

// Chart options
const options = {
  tooltip: { trigger: "axis" },
  xAxis: {
    type: "category",
    data: data.map(d => d.date || d.week || d.month)
  },
  yAxis: {
    type: "value",
    name: "良品率",
    min: 80,
    max: 100,
    axisLabel: { formatter: "{value}%" }
  },
  series: [{
    type: "line",
    data: data.map(d => d.goodRate.toFixed(1)),
    smooth: true,
    areaStyle: { opacity: 0.2 }
  }]
};
```

---

## 8. Shift Comparison Chart

```tsx
// ShiftChart.tsx using ECharts
interface ShiftChartProps {
  data: ShiftMetrics[];
  height?: number;
}

// Chart options
const options = {
  tooltip: { trigger: "axis" },
  legend: { data: ["白班", "夜班"] },
  xAxis: { type: "category", data: ["总数", "良品", "不良"] },
  yAxis: { type: "value" },
  series: [
    { name: "白班", type: "bar", data: [dayShift.total, dayShift.good, dayShift.defect] },
    { name: "夜班", type: "bar", data: [nightShift.total, nightShift.good, nightShift.defect] }
  ]
};
```

---

## 9. Page Implementation

### quality/page.tsx (Enhanced)

```tsx
export default function QualityDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get drilldown params
  const workshop = searchParams.get("workshop");
  const line = searchParams.get("line");
  const device = searchParams.get("device");
  
  // Filter records based on params
  const filteredRecords = records.filter(r => {
    if (workshop && r.workshop !== workshop) return false;
    if (line && r.line !== line) return false;
    // device filtering used for detail panel only
    return true;
  });
  
  // Device detail panel
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  return (
    <div>
      <DrillDownNav
        workshop={workshop}
        line={line}
        onNavigate={handleNavigate}
      />
      
      {/* KPI Cards based on current level */}
      <KPICards data={filteredRecords} level={getLevel(workshop, line, device)} />
      
      {/* Charts based on current level */}
      <TrendChart data={filteredRecords} />
      
      {/* Rankings/tables */}
      {getRankingTable(workshop, line, device)}
      
      {/* Device detail panel */}
      <DeviceDetailPanel
        device={selectedDevice}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
    </div>
  );
}
```

### quality/history/page.tsx (New)

```tsx
export default function QualityHistoryPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  
  // Filter records by time range
  const filteredRecords = records.filter(r => isInRange(r.timestamp, timeRange));
  
  return (
    <div>
      <h1>历史分析</h1>
      
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      
      {/* Granularity tabs */}
      <GranularityTabs granularity={granularity} onChange={setGranularity} />
      
      {/* Main chart */}
      <TrendChart data={filteredRecords} granularity={granularity} />
      
      {/* Shift comparison */}
      <ShiftChart data={aggregateByShift(filteredRecords)} />
      
      {/* Data table */}
      <DataTable data={getAggregatedData(filteredRecords, granularity)} />
    </div>
  );
}
```

---

## 10. Rollback Plan

If deployment fails:
- Revert to previous commit
- No database migration needed (data is in-memory from CSV)

Files to delete if rollback needed:
- `src/app/(dashboard)/w/[slug]/quality/history/page.tsx`
- `src/components/charts/DrillDownNav.tsx`
- `src/components/charts/DeviceDetailPanel.tsx`
- `src/components/charts/TimeRangeSelector.tsx`
- `src/components/charts/TrendChart.tsx`
- `src/components/charts/ShiftChart.tsx`
- `src/lib/quality-parser.ts` additions
