// ===== Widget Configuration Types =====

export interface WidgetConfig {
  xField?: string;
  yField?: string;
  yFields?: string[];
  categoryField?: string;
  valueField?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  colors?: string[];
}

export interface WidgetPosition {
  col: number;
  row: number;
  w: number;
  h: number;
}

// ===== Dataset Types =====

export interface DatasetColumn {
  name: string;
  type: "string" | "number" | "date";
}

export interface DatasetSchema {
  columns: DatasetColumn[];
  rows: Record<string, string | number>[];
}

// ===== Chart Component Props =====

export interface ChartProps {
  data: Record<string, string | number>[];
  config: WidgetConfig;
  title?: string;
}

// ===== Widget with Relations =====

export interface WidgetWithDataset {
  id: string;
  title: string;
  type: string;
  config: WidgetConfig;
  position: WidgetPosition;
  datasetId: string | null;
  dashboardId: string;
  dataset?: {
    id: string;
    name: string;
    schema: DatasetSchema | null;
  } | null;
}
