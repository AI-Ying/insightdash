"use client";

import type { WidgetConfig, DatasetSchema } from "@/lib/types";
import { BarChartWidget } from "./bar-chart";
import { LineChartWidget } from "./line-chart";
import { PieChartWidget } from "./pie-chart";
import { AreaChartWidget } from "./area-chart";
import { KpiCard } from "./kpi-card";

interface ChartWrapperProps {
  type: string;
  config: WidgetConfig;
  title: string;
  datasetSchema: DatasetSchema | null;
}

export function ChartWrapper({ type, config, title, datasetSchema }: ChartWrapperProps) {
  const data = datasetSchema?.rows || [];

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No data available. Assign a dataset to this widget.
      </div>
    );
  }

  const chartProps = { data, config, title };

  switch (type) {
    case "BAR_CHART":
      return <BarChartWidget {...chartProps} />;
    case "LINE_CHART":
      return <LineChartWidget {...chartProps} />;
    case "PIE_CHART":
      return <PieChartWidget {...chartProps} />;
    case "AREA_CHART":
      return <AreaChartWidget {...chartProps} />;
    case "KPI_CARD":
      return <KpiCard {...chartProps} />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Unsupported chart type: {type}
        </div>
      );
  }
}
