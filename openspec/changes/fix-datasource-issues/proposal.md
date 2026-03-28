# Proposal: 修复 Datasource 页面问题

## Intent

修复 Datasource 相关页面的潜在问题，确保：
- CSV 上传功能正常
- 数据源列表展示正确
- 数据源详情页数据表格正常显示
- 删除功能正常工作

## Scope

### In Scope
- Datasource 列表页 (`/w/[slug]/datasources/page.tsx`)
- Datasource 详情页 (`/w/[slug]/datasources/[id]/page.tsx`)
- CSV 上传组件 (`csv-upload-modal.tsx`)
- Datasource API 路由

### Out of Scope
- Dashboard 页面修改
- 认证流程修改
- 其他页面修复

## Approach

基于代码审查发现以下潜在问题：

### 问题 1: Dataset Tab 选择逻辑
当前 `activeDataset` 初始化为空字符串，可能导致首次加载时选中错误的 dataset。

### 问题 2: Schema 解析错误处理
当 dataset.schema 为 null 或解析失败时，表格会显示空白但无提示。

### 问题 3: CSV 上传错误处理
错误信息可能不够友好，且上传失败后 modal 状态不正确。

### 问题 4: 缺少 Dataset 切换 Tab
详情页虽然有 `activeDataset` state，但没有 Tab UI 让用户切换不同的 dataset。

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(dashboard)/w/[slug]/datasources/[id]/page.tsx` | Modified | 修复 dataset 切换和错误提示 |
| `src/components/datasource/csv-upload-modal.tsx` | Modified | 改善错误处理 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| 引入新 Bug | Low | 代码审查 + 测试 |
| 破坏现有功能 | Low | 只改 UI 逻辑 |

## Rollback Plan

通过 Git revert 回退更改。

## Dependencies

无外部依赖。

## Success Criteria

- [ ] Dataset 详情页有 Tab 切换功能
- [ ] Schema 解析失败时显示友好提示
- [ ] CSV 上传错误正确显示
- [ ] 现有功能不受影响
