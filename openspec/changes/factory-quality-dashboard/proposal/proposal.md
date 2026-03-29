# Proposal: 工厂质量分析 Dashboard

## Intent

为一体化压铸工厂提供实时质量监控大屏，帮助厂长/质量工程师及时发现问题。

## Scope

### In Scope
- 工厂层级结构：工厂 → 车间 → 产线 → 设备
- 质量指标：良品率、缺陷率、设备 OEE
- 告警规则：阈值触发告警
- 数据来源：边缘设备 MQTT 上报（简化版）

### Out of Scope
- 实时 MQTT 推送（Phase 2）
- 微信/邮件通知（Phase 2）
- 历史数据分析（Phase 2）

## Approach

### 数据来源
边缘设备通过 MQTT 上报 JSON 数据，简化版支持 CSV 导入 + API 轮询。

### MQTT Topic 结构
```
factory/{workshop}/{line}/{device}/quality
```

示例数据：
```json
{
  "device_id": "DIE_CAST_01",
  "device_type": "压铸机",
  "workshop": "压铸车间",
  "line": "压铸岛1",
  "timestamp": "2026-03-29T13:00:00",
  "total": 10,
  "good": 9,
  "defect": 1,
  "defect_code": "P01"
}
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/quality-parser.ts` | New | 质量数据解析 |
| `src/app/(dashboard)/w/[slug]/quality/page.tsx` | New | 质量大屏页面 |
| `src/components/charts/quality-charts.tsx` | New | 质量图表组件 |
| `src/app/api/datasources/quality/route.ts` | New | 质量数据 API |
| `public/sample/quality-sample.csv` | New | 示例数据 |

## Success Criteria

- [ ] 展示工厂层级结构
- [ ] 实时显示良品率、缺陷数
- [ ] 24小时趋势图
- [ ] 车间/设备排名
- [ ] 不良类型分布
- [ ] 告警列表
- [ ] 车间切换下钻
- [ ] CSV 示例数据可导入
