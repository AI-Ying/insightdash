# Spec: 工厂质量分析 Dashboard

## Requirement: 工厂层级结构

The system SHALL display a hierarchical structure of factory → workshop → line → device.

### Scenario: Browse factory hierarchy

- GIVEN user is on quality dashboard
- WHEN user selects a workshop from dropdown
- THEN dashboard shows data for selected workshop
- WHEN user clicks on a specific line/device
- THEN dashboard filters to show that line/device data

## Requirement: Quality Metrics Display

The system SHALL display key quality metrics with trend indicators.

### KPI Cards

| Metric | Calculation | Display |
|--------|-----------|---------|
| 良品率 | good/total × 100% | 百分比 + 趋势箭头 |
| 不良数 | sum(defect) | 数量 + 环比变化 |
| 告警数 | count(alerts) | 数量 |
| OEE | (可用率×性能率×质量率) | 百分比 |

### Scenario: Display with trend

- GIVEN quality data exists
- WHEN dashboard loads
- THEN show current value + comparison to previous period
- AND show trend arrow (↑ green / ↓ red / -- gray)

## Requirement: Quality Trend Chart

The system SHALL display a 24-hour trend chart of quality metrics.

- GIVEN quality data exists
- WHEN dashboard loads
- THEN show line chart of quality rate over past 24 hours
- AND show hour-by-hour granularity

## Requirement: Workshop/Line Ranking

The system SHALL rank lines/devices by quality performance.

- GIVEN quality data exists
- WHEN user views ranking
- THEN show lines sorted by defect rate (worst first)
- AND show defect count for each line

## Requirement: Defect Type Distribution

The system SHALL show defect type breakdown.

- GIVEN defect records exist
- WHEN user views distribution
- THEN show pie/bar chart of defect types
- AND show percentage for each type

## Requirement: Alert List

The system SHALL display active quality alerts.

- GIVEN quality metrics exceed threshold
- WHEN alert is triggered
- THEN add to alert list with timestamp, location, metric, value

### Alert Rules

| Rule | Condition | Severity |
|------|-----------|----------|
| 良品率低 | rate < 95% | Warning |
| 良品率严重 | rate < 90% | Critical |
| 缺陷突增 | 30min 内 > 10 defects | Warning |
| 单设备连续不良 | 连续 3 件 | Warning |

## Requirement: CSV Sample Data

The system SHALL provide sample quality data for testing.

### Sample Data Format (CSV)

```csv
timestamp,workshop,line,device,total,good,defect,defect_code
2026-03-29 08:00,压铸车间,压铸岛1,压铸机01,100,97,3,P01
2026-03-29 08:00,压铸车间,压铸岛1,模温机01,100,98,2,P02
2026-03-29 08:00,质检车间,X-ray线1,X-ray01,50,48,2,P03
```

### Defect Codes

| Code | Type |
|------|------|
| P01 | 气孔 |
| P02 | 裂纹 |
| P03 | 变形 |
| P04 | 尺寸偏差 |
| P05 | 外观缺陷 |
| P99 | 其他 |

## AFFECTED AREAS

| Area | Impact | Description |
|------|--------|-------------|
| `public/sample/quality-sample.csv` | New | 示例数据 |
| `src/lib/quality-parser.ts` | New | 质量数据解析 |
| `src/app/(dashboard)/w/[slug]/quality/page.tsx` | New | 质量大屏 |
| `src/components/charts/quality-kpi-card.tsx` | New | KPI 卡片 |
| `src/components/charts/quality-trend-chart.tsx` | New | 趋势图 |
| `src/components/charts/quality-ranking.tsx` | New | 排名组件 |
| `src/components/charts/quality-alert-list.tsx` | New | 告警列表 |
