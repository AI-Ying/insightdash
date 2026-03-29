# Spec: 仪表板导出 PDF 功能

## Requirement 1: 导出按钮

The system SHALL display an "Export PDF" button on the dashboard page.

### Scenario: Display export button

- GIVEN user is viewing a dashboard
- THEN show an export button in the dashboard header
- AND button has icon (Download/Printer icon)

## Requirement 2: 导出选项弹窗

The system SHALL show export options before generating PDF.

### Scenario: Open export dialog

- GIVEN user clicks "Export PDF" button
- THEN show a modal dialog with export options
- AND include paper size selection (A4 / Letter)
- AND include orientation (Portrait / Landscape)

### Dialog Options

| 选项 | 类型 | 默认值 |
|------|------|--------|
| 纸张大小 | A4 / Letter | A4 |
| 方向 | 纵向 / 横向 | 纵向 |

## Requirement 3: PDF 生成

The system SHALL generate a PDF file from the current dashboard.

### Scenario: Generate PDF

- GIVEN user selects export options
- WHEN user clicks "Export" button
- THEN show loading indicator ("正在生成 PDF...")
- THEN capture dashboard HTML using html2canvas
- THEN generate PDF using jspdf
- THEN trigger browser download

### File Naming

```
{仪表板标题}_{YYYY-MM-DD}.pdf
```

Example: `工厂监控仪表板_2026-03-29.pdf`

## Requirement 4: 错误处理

The system SHALL handle export errors gracefully.

### Scenario: Export failure

- GIVEN PDF generation fails
- THEN show error message: "导出失败，请重试"
- AND hide loading indicator
- AND do not close dialog

## Requirement 5: 加载状态

The system SHALL show loading state during PDF generation.

### Scenario: Show loading

- GIVEN user clicks "Export"
- THEN show loading overlay: "正在生成 PDF..."
- AND disable export button
- AND allow cancel action

## Data Structures

```typescript
interface ExportOptions {
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}

interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}
```

## Acceptance Criteria

- [ ] Export button visible in dashboard header
- [ ] Clicking button opens export dialog
- [ ] Paper size and orientation selectable
- [ ] PDF generated and downloaded on confirm
- [ ] Loading indicator shown during generation
- [ ] Error message shown on failure
- [ ] Filename includes dashboard title and date
