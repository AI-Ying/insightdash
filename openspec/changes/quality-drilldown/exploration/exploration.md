# 探索：产线数据分析 & 历史数据分析

## 背景

用户已实现质量大屏 MVP，现在需要增强功能：
1. 产线的数据分析（下钻功能）
2. 历史数据分析

---

## 功能 1: 产线数据分析（下钻）

### 用户场景

```
工厂层 → 压铸车间 → 压铸岛1 → 压铸机01
```

### 当前状态

质量大屏只显示"压铸车间"整体数据，用户无法下钻查看产线/设备详情。

### 需求分析

| 层级 | 数据粒度 | 分析内容 |
|------|---------|---------|
| 车间 | 汇总 | 良品率、不良数、告警 |
| 产线 | 明细 | 良品率排名、不良类型分布 |
| 设备 | 单点 | 单设备参数、不良记录 |

### UI 交互设计

**方案 A：下钻卡片**
- 点击车间 → 卡片展开显示产线列表
- 点击产线 → 显示设备列表

**方案 B：跳转页面**
- 点击车间 → 跳转 `/quality?workshop=压铸车间`
- 点击产线 → 跳转 `/quality?line=压铸岛1`

**推荐方案 B**：URL 参数可分享、便于书签保存

### 数据需求

需要支持按 `workshop` + `line` + `device` 三级过滤。

当前 `quality-parser.ts` 已有：
- `aggregateByWorkshop()`
- `aggregateByLine()`
- `aggregateByDevice()`

只需扩展 UI 层。

---

## 功能 2: 历史数据分析

### 用户场景

- 质检班长：查看上周不良率趋势，对比不同班次表现
- 厂长：查看月度质量报告

### 时间维度

| 维度 | 说明 |
|------|------|
| 班次 | 白班(8:00-20:00) / 夜班(20:00-8:00) |
| 日 | 每日汇总 |
| 周 | 每周汇总 |
| 月 | 每月汇总 |

### 数据聚合需求

```typescript
// 按时间聚合
aggregateByShift(records)  // 白班/夜班
aggregateByDay(records)   // 每日
aggregateByWeek(records)  // 每周
aggregateByMonth(records) // 每月
```

### 图表类型

| 图表 | 用途 |
|------|------|
| 折线图 | 趋势对比（日/周/月） |
| 柱状图 | 班次对比（白班 vs 夜班） |
| 表格 | 明细数据 |

### 时间选择器

- 快捷选项：今日/本周/本月/上月/自定义
- 自定义范围：选择起始/结束日期

---

## 技术方案

### 数据层扩展

```typescript
// quality-parser.ts 新增
export function aggregateByDay(records: QualityRecord[]): DailyMetrics[]
export function aggregateByShift(records: QualityRecord[]): ShiftMetrics[]
export function getDeviceDetail(records: QualityRecord[], device: string): DeviceMetrics
```

### UI 层新增组件

1. **DrillDownNav** - 层级导航（工厂 > 车间 > 产线 > 设备）
2. **TimeRangeSelector** - 时间范围选择器
3. **HistoricalTrendChart** - 历史趋势图（支持多时间维度）
4. **ShiftComparisonChart** - 班次对比图

### URL 参数设计

```
/quality                           # 全厂视图
/quality?workshop=压铸车间          # 车间视图
/quality?workshop=压铸车间&line=压铸岛1  # 产线视图
/quality?device=压铸机01           # 设备视图

/history                           # 历史分析首页
/history?range=today|week|month|custom
/history?start=2026-03-01&end=2026-03-29
```

---

## 优先级建议

| 优先级 | 功能 | 理由 |
|--------|------|------|
| P0 | 产线下钻（页面跳转） | 增强现有大屏，价值明确 |
| P1 | 时间选择器 | 历史分析入口 |
| P2 | 班次统计 | 工厂实际需求（白班/夜班） |
| P3 | 日/周/月趋势图 | 更高层次分析 |

---

## 待确认

1. 班次定义是否正确？（白班 8:00-20:00，夜班 20:00-8:00）
2. 历史数据保留多久？（7天/30天/90天）
3. 产线下钻深度是否只需要 3 级（车间→产线→设备）？
