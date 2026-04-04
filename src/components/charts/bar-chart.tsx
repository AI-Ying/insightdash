"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartProps } from "@/lib/types";

import { DEFAULT_COLORS, CHART_MARGINS, AXIS_STYLE, TOOLTIP_STYLE } from "@/lib/chart-config";

export const BarChartWidget = React.memo(function BarChartWidget({ data, config }: ChartProps) {
  const xField = config.xField || "name";
  const yFields = config.yFields || (config.yField ? [config.yField] : ["value"]);
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey={xField}
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
        />
        <YAxis
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
        />
        {yFields.length > 1 && <Legend />}
        {yFields.map((field, i) => (
          <Bar
            key={field}
            dataKey={field}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
});
