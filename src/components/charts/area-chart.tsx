"use client";

import * as React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartProps } from "@/lib/types";

import { DEFAULT_COLORS, CHART_MARGINS, AXIS_STYLE, TOOLTIP_STYLE } from "@/lib/chart-config";

export const AreaChartWidget = React.memo(function AreaChartWidget({ data, config }: ChartProps) {
  const xField = config.xField || "name";
  const yFields = config.yFields || (config.yField ? [config.yField] : ["value"]);
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={CHART_MARGINS}>
        <defs>
          {yFields.map((field, i) => (
            <linearGradient key={field} id={`gradient-${field}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
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
          <Area
            key={field}
            type="monotone"
            dataKey={field}
            stroke={colors[i % colors.length]}
            fill={`url(#gradient-${field})`}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
});
