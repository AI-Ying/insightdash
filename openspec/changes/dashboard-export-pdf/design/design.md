# Design: 仪表板导出 PDF 功能

## Technical Approach

### Dependencies
```bash
npm install html2canvas jspdf
```

### Architecture

```
Dashboard Page
├── ExportButton (header)
└── ExportDialog (modal)
    ├── html2canvas (capture)
    └── jsPDF (generate)
```

## Component: ExportDialog

```tsx
interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  dashboardTitle: string;
  targetRef: React.RefObject<HTMLDivElement>;  // Dashboard container ref
}

interface ExportOptions {
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}
```

## PDF Generation Flow

1. User clicks "Export PDF" button
2. Modal opens with options (A4/Letter, Portrait/Landscape)
3. User clicks "Export"
4. Show loading: "正在生成 PDF..."
5. html2canvas captures dashboard DOM
6. jsPDF creates PDF with selected options
7. Browser triggers download
8. Close modal

## Page Size Reference

| Size | Dimensions (px at 96dpi) |
|------|--------------------------|
| A4 | 794 x 1123 |
| Letter | 850 x 1100 |

## Implementation

### Files to Create

| File | Description |
|------|-------------|
| `src/components/dashboard/export-dialog.tsx` | Export modal component |
| `src/lib/pdf-export.ts` | PDF generation utility |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/(dashboard)/w/[slug]/dashboards/[id]/page.tsx` | Add export button and dialog |

## Rollback Plan

If deployment fails:
- Revert to previous commit
- No database migration needed
- Remove `html2canvas` and `jspdf` from dependencies
