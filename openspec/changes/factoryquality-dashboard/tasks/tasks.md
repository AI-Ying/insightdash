# Tasks: 工厂质量分析 Dashboard

## Phase 1: 示例数据与解析

- [ ] 1.1 创建 `public/sample/quality-sample.csv` 示例数据（50+ 条记录）
- [ ] 1.2 创建 `src/lib/quality-parser.ts` 质量数据解析器
- [ ] 1.3 实现 `parseQualityCSV()` CSV 解析
- [ ] 1.4 实现 `aggregateByWorkshop()` 聚合计算
- [ ] 1.5 实现 `calculate24hTrend()` 趋势计算
- [ ] 1.6 实现 `checkAlerts()` 告警规则

## Phase 2: 质量大屏页面

- [ ] 2.1 创建 `src/app/(dashboard)/w/[slug]/quality/page.tsx`
- [ ] 2.2 添加车间选择器（下拉切换）
- [ ] 2.3 添加 KPI 卡片区域
- [ ] 2.4 添加 24h 趋势图区域
- [ ] 2.5 添加车间排名区域
- [ ] 2.6 添加不良类型分布区域
- [ ] 2.7 添加告警列表区域

## Phase 3: 图表组件

- [ ] 3.1 创建 `src/components/charts/quality-kpi-card.tsx`
- [ ] 3.2 创建 `src/components/charts/quality-trend-chart.tsx` (使用 ECharts)
- [ ] 3.3 创建 `src/components/charts/quality-ranking.tsx`
- [ ] 3.4 创建 `src/components/charts/quality-defect-distribution.tsx`
- [ ] 3.5 创建 `src/components/charts/quality-alert-list.tsx`

## Phase 4: 测试与验证

- [ ] 4.1 测试 CSV 解析正确性
- [ ] 4.2 测试告警规则触发
- [ ] 4.3 测试车间切换
- [ ] 4.4 TypeScript 编译检查
- [ ] 4.5 构建测试

## Phase 5: GitHub

- [ ] 5.1 Git 提交
- [ ] 5.2 推送到 GitHub
- [ ] 5.3 部署到 Render
- [ ] 5.4 验证功能
