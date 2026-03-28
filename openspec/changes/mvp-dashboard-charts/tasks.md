# Tasks: mvp-dashboard-charts

## Phase 1: Foundation
- [x] 1.1 Update `src/lib/validations.ts` — add dashboardSchema, widgetSchema, widgetUpdateSchema
- [x] 1.2 Create `src/lib/types.ts` — WidgetConfig, WidgetPosition, ChartProps, DatasetColumn types
- [x] 1.3 Create `src/lib/sample-data.ts` — sample data generator with seedWorkspaceSampleData()
- [x] 1.4 Create `src/lib/api-utils.ts` — verifyWorkspaceMembership() helper

## Phase 2: API Routes
- [x] 2.1 Create `src/app/api/workspaces/[workspaceId]/dashboards/route.ts` — GET list + POST create
- [x] 2.2 Create `src/app/api/workspaces/[workspaceId]/dashboards/[dashboardId]/route.ts` — GET + DELETE
- [x] 2.3 Create `src/app/api/workspaces/[workspaceId]/dashboards/[dashboardId]/widgets/route.ts` — GET + POST
- [x] 2.4 Create `src/app/api/workspaces/[workspaceId]/dashboards/[dashboardId]/widgets/[widgetId]/route.ts` — PATCH + DELETE
- [x] 2.5 Create `src/app/api/workspaces/[workspaceId]/datasets/[datasetId]/data/route.ts` — GET dataset rows

## Phase 3: Chart Components
- [x] 3.1 Create `src/components/charts/bar-chart.tsx`
- [x] 3.2 Create `src/components/charts/line-chart.tsx`
- [x] 3.3 Create `src/components/charts/pie-chart.tsx`
- [x] 3.4 Create `src/components/charts/area-chart.tsx`
- [x] 3.5 Create `src/components/charts/kpi-card.tsx`
- [x] 3.6 Create `src/components/charts/chart-wrapper.tsx`

## Phase 4: Dashboard UI
- [x] 4.1 Create `src/components/dashboard/widget-grid.tsx`
- [x] 4.2 Create `src/components/dashboard/widget-config-panel.tsx`
- [x] 4.3 Create `src/app/(dashboard)/w/[slug]/dashboards/page.tsx` — dashboard list
- [x] 4.4 Create `src/app/(dashboard)/w/[slug]/dashboards/[id]/page.tsx` — dashboard editor
- [x] 4.5 Modify `src/app/(dashboard)/w/[slug]/page.tsx` — add dashboard links

## Phase 5: Verify
- [ ] 5.1 Build check — `npm run build`
- [ ] 5.2 Manual smoke test — create dashboard, add widgets
