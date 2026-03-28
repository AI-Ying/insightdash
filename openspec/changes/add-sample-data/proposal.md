# Proposal: 添加示例数据和引导流程

## Intent

解决新用户不知道上传什么 CSV 数据、以及如何创建数据分析图表的问题。通过提供示例数据和清晰的引导流程，让用户快速上手。

## Scope

### In Scope
- 创建示例 CSV 数据文件（模拟工厂传感器数据，符合用户行业）
- 创建示例 Dashboard 预配置图表
- 添加"加载示例数据"功能按钮

### Out of Scope
- 用户引导教程（onboarding flow）
- 数据导入向导（import wizard）

## Approach

### 示例数据设计

**数据主题**：工厂传感器监控数据（贴合用户工业 IoT 背景）

```
示例 CSV：factory_sensors.csv
- 时间戳 (timestamp)
- 温度 (temperature) 
- 压力 (pressure)
- 流量 (flow_rate)
- 设备 ID (device_id)
- 告警状态 (alarm)
```

**示例 Dashboard**：
- 温度趋势折线图
- 压力分布柱状图
- 告警状态饼图
- KPI 卡片（平均温度、总告警数）

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `public/sample/` | New | 示例 CSV 文件 |
| `src/app/(dashboard)/w/[slug]/page.tsx` | Modified | 添加示例数据加载按钮 |
| `src/app/api/` | Modified | 示例数据初始化 API |

## Success Criteria

- [ ] 用户可见"加载示例数据"按钮
- [ ] 点击后自动创建 DataSource + Dataset + Dashboard
- [ ] Dashboard 有 3-4 个预配置的图表
