# Tasks: mvp-csv-datasource

## Phase 1: Backend — CSV Upload & Parsing
- [ ] 1.1 Install `papaparse` dependency for CSV parsing
- [ ] 1.2 Create `src/lib/csv-parser.ts` — parse CSV buffer to columns + rows, infer types
- [ ] 1.3 Create `src/app/api/workspaces/[workspaceId]/datasources/route.ts` — GET list + POST create (with CSV upload via FormData)
- [ ] 1.4 Create `src/app/api/workspaces/[workspaceId]/datasources/[datasourceId]/route.ts` — GET detail + DELETE

## Phase 2: Data Sources UI
- [ ] 2.1 Create `src/app/(dashboard)/w/[slug]/datasources/page.tsx` — data source list with upload button
- [ ] 2.2 Create `src/components/datasource/csv-upload-modal.tsx` — drag & drop CSV upload modal with preview
- [ ] 2.3 Create `src/app/(dashboard)/w/[slug]/datasources/[id]/page.tsx` — dataset detail with data table preview

## Phase 3: Integration with Dashboard Editor
- [ ] 3.1 Update dashboard editor to load all workspace datasets (sample + uploaded)
- [ ] 3.2 Update widget config panel — show dataset source label, search/filter datasets
- [ ] 3.3 Ensure sample data seeding still works alongside user uploads

## Phase 4: Verify & Deploy
- [ ] 4.1 Build check — `npm run build`
- [ ] 4.2 Push to GitHub + Render deploy
