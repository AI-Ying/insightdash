"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartProps } from "@/lib/types";

import { DEFAULT_COLORS, TOOLTIP_STYLE } from "@/lib/chart-config";

export const PieChartWidget = React.memo(function PieChartWidget({ data, config }: ChartProps) {
  const categoryField = config.categoryField || config.xField || "name";
  const valueField = config.valueField || config.yField || "value";
  const colors = config.colors || DEFAULT_COLORS;

  const chartData = data.map((item) => ({
    name: String(item[categoryField] || ""),
    value: Number(item[valueField] || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="70%"
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: "#94a3b8" }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
});
