# Tasks: API 数据源支持

## Phase 1: 基础设施

- [ ] 1.1 创建 `src/lib/api-parser.ts` — API fetch + JSON 解析 + 类型推断
- [ ] 1.2 创建 `src/lib/constants.ts` — 8 个 API 模板定义

## Phase 2: 后端修改

- [ ] 2.1 修改 `src/app/api/workspaces/[...]/datasources/route.ts` — 添加 API 类型分支
- [ ] 2.2 添加数据源名称生成逻辑

## Phase 3: 前端组件

- [ ] 3.1 创建 `src/components/datasource/api-upload-modal.tsx` — API 配置 Modal UI
- [ ] 3.2 修改 `src/app/(dashboard)/w/[slug]/datasources/page.tsx` — 添加"添加 API"按钮
- [ ] 3.3 测试 CSV 上传不受影响

## Phase 4: 测试

- [ ] 4.1 测试 8 个模板是否都能正常工作
- [ ] 4.2 测试测试连接功能
- [ ] 4.3 测试 Dashboard 图表显示 API 数据
- [ ] 4.4 测试错误处理（API 失败、超时）

## Phase 5: GitHub

- [ ] 5.1 Git 提交所有更改
- [ ] 5.2 推送到 GitHub
- [ ] 5.3 部署到 Render
- [ ] 5.4 验证功能
