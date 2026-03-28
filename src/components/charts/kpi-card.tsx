"use client";

import type { ChartProps } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function KpiCard({ data, config, title }: ChartProps) {
  const valueField = config.valueField || config.yField || "value";
  const aggregation = config.aggregation || "sum";

  const values = data.map((r) => Number(r[valueField] || 0));

  let result = 0;
  if (aggregation === "sum") result = values.reduce((a, b) => a + b, 0);
  else if (aggregation === "avg") result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  else if (aggregation === "count") result = values.length;
  else if (aggregation === "min") result = Math.min(...values);
  else if (aggregation === "max") result = Math.max(...values);

  // Calculate trend from last two data points
  let trend: "up" | "down" | "flat" = "flat";
  if (values.length >= 2) {
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    if (last > prev) trend = "up";
    else if (last < prev) trend = "down";
  }

  const formatted = result >= 1000
    ? `${(result / 1000).toFixed(result >= 100000 ? 0 : 1)}k`
    : result.toFixed(result % 1 === 0 ? 0 : 1);

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
        {title || valueField}
      </p>
      <p className="mt-2 text-4xl font-bold text-slate-900">{formatted}</p>
      <div className="mt-2 flex items-center gap-1">
        {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
        {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
        {trend === "flat" && <Minus className="h-4 w-4 text-slate-400" />}
        <span
          className={`text-sm font-medium ${
            trend === "up"
              ? "text-emerald-600"
              : trend === "down"
              ? "text-red-600"
              : "text-slate-500"
          }`}
        >
          {aggregation}
        </span>
      </div>
    </div>
  );
}
