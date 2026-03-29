# Spec: 产线数据分析 & 历史数据分析

---

## Part A: 产线数据分析（下钻）

### Requirement A.1: 层级导航

The system SHALL display a breadcrumb navigation showing current drilldown level.

#### Scenario: Display current level

- GIVEN user is viewing the quality dashboard
- WHEN page loads or URL parameters change
- THEN display navigation: `全厂 > {车间} > {产线} > {设备}`
- AND each level is clickable except current

### Requirement A.2: Workshop Filter

The system SHALL filter data by workshop when `workshop` parameter is present.

#### Scenario: Filter by workshop

- GIVEN user navigates to `/quality?workshop=压铸车间`
- THEN dashboard shows only data for 压铸车间
- AND URL is updated to reflect filter
- AND back navigation shows "全厂" link

### Requirement A.3: Line Filter

The system SHALL filter data by line when `line` parameter is present.

#### Scenario: Filter by line

- GIVEN user navigates to `/quality?workshop=压铸车间&line=压铸岛1`
- THEN dashboard shows only data for 压铸岛1 within 压铸车间
- AND displays devices within this line

### Requirement A.4: Device Detail Panel

The system SHALL display device details when user clicks on a device.

#### Scenario: Open device panel

- GIVEN user is viewing a line filtered view
- WHEN user clicks on a device row
- THEN a slide-out panel opens on the right
- AND shows: device name, current shift metrics, defect history, parameters

### Requirement A.5: Navigation Back

The system SHALL navigate to parent level when user clicks breadcrumb or back.

#### Scenario: Navigate up

- GIVEN user is at `/quality?workshop=压铸车间&line=压铸岛1`
- WHEN user clicks "压铸车间" in breadcrumb
- THEN URL becomes `/quality?workshop=压铸车间`
- AND view updates to show all lines in 压铸车间

---

## Part B: 历史数据分析

### Requirement B.1: Time Range Selector

The system SHALL provide a time range selector with preset and custom options.

#### Scenario: Select preset range

- GIVEN user is on history page
- WHEN user selects "今日"
- THEN show data for current day only
- WHEN user selects "本周"
- THEN show data for current week (Monday to today)

### Requirement B.2: Custom Date Range

The system SHALL support custom date range selection.

#### Scenario: Select custom range

- GIVEN user clicks "自定义"
- WHEN user selects start date "2026-03-01" and end date "2026-03-29"
- THEN display data for that date range

### Requirement B.3: Shift Aggregation

The system SHALL aggregate data by shift (day/night).

#### Scenario: Display shift comparison

- GIVEN user selects a date range
- WHEN data is displayed
- THEN show separate metrics for:
  - 白班 (08:00 - 20:00)
  - 夜班 (20:00 - 08:00 next day)

### Requirement B.4: Daily Aggregation

The system SHALL aggregate data by day.

#### Scenario: Daily trend

- GIVEN user selects "本周"
- WHEN chart is displayed
- THEN show line chart with daily data points
- AND X-axis shows dates, Y-axis shows good rate %

### Requirement B.5: Weekly Aggregation

The system SHALL aggregate data by week.

#### Scenario: Weekly trend

- GIVEN user selects date range spanning multiple weeks
- WHEN user switches to "周" view
- THEN show bar chart with weekly totals
- AND each bar represents one week

### Requirement B.6: Monthly Aggregation

The system SHALL aggregate data by month.

#### Scenario: Monthly trend

- GIVEN user selects date range spanning multiple months
- WHEN user switches to "月" view
- THEN show bar chart with monthly totals

### Requirement B.7: Historical Trend Chart

The system SHALL display a line chart showing quality trend over time.

#### Scenario: Display trend

- GIVEN user selects date range and granularity
- THEN display ECharts line chart with:
  - X-axis: time (day/week/month labels)
  - Y-axis: good rate percentage (0-100%)
  - Data points connected by line
  - Tooltip showing exact values on hover

### Requirement B.8: Shift Comparison Chart

The system SHALL display a bar chart comparing day vs night shift.

#### Scenario: Compare shifts

- GIVEN user selects date range
- THEN display grouped bar chart:
  - Group 1: 白班 metrics
  - Group 2: 夜班 metrics
  - Bars: total, good, defect counts

---

## Part C: Data Parser Extensions

### Requirement C.1: Shift Parsing

The parser SHALL determine shift from timestamp.

#### Scenario: Classify shift

- GIVEN timestamp "2026-03-29 08:00:00"
- THEN shift = "白班"
- GIVEN timestamp "2026-03-29 20:00:00"
- THEN shift = "夜班"

### Requirement C.2: Day Parsing

The parser SHALL extract date from timestamp for daily aggregation.

### Requirement C.3: Week Parsing

The parser SHALL calculate week number from date for weekly aggregation.

### Requirement C.4: Month Parsing

The parser SHALL extract month from date for monthly aggregation.

---

## Data Structures

```typescript
interface QualityRecord {
  timestamp: string;      // ISO format
  workshop: string;
  line: string;
  device: string;
  total: number;
  good: number;
  defect: number;
  defectCode: string;
}

interface ShiftMetrics {
  shift: "白班" | "夜班";
  total: number;
  good: number;
  defect: number;
  goodRate: number;
}

interface DailyMetrics {
  date: string;           // "2026-03-29"
  total: number;
  good: number;
  defect: number;
  goodRate: number;
}

interface WeeklyMetrics {
  week: string;          // "2026-W13"
  weekStart: string;    // "2026-03-24"
  total: number;
  good: number;
  defect: number;
  goodRate: number;
}

interface MonthlyMetrics {
  month: string;         // "2026-03"
  total: number;
  good: number;
  defect: number;
  goodRate: number;
}

interface DeviceDetail {
  device: string;
  line: string;
  workshop: string;
  total: number;
  good: number;
  defect: number;
  goodRate: number;
  defectBreakdown: Record<string, number>;  // defectCode -> count
  hourlyTrend: HourlyTrend[];
}
```

---

## Acceptance Criteria

### A: Drilldown
- [ ] Breadcrumb shows current location
- [ ] Clicking workshop filters to that workshop
- [ ] Clicking line filters to that line
- [ ] Clicking device opens detail panel
- [ ] Back navigation works correctly

### B: Historical Analysis
- [ ] Time selector shows 今日/本周/本月/上月/自定义
- [ ] Custom range allows date selection
- [ ] Shift chart shows day vs night comparison
- [ ] Daily chart shows day-by-day trend
- [ ] Weekly chart shows week-by-week aggregation
- [ ] Monthly chart shows month-by-month aggregation

### C: Parser
- [ ] parseShift() correctly classifies timestamps
- [ ] aggregateByDay() groups records by date
- [ ] aggregateByWeek() groups records by week
- [ ] aggregateByMonth() groups records by month
