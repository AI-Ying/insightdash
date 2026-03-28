"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartProps } from "@/lib/types";

const DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function LineChartWidget({ data, config }: ChartProps) {
  const xField = config.xField || "name";
  const yFields = config.yFields || (config.yField ? [config.yField] : ["value"]);
  const colors = config.colors || DEFAULT_COLORS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey={xField}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        {yFields.length > 1 && <Legend />}
        {yFields.map((field, i) => (
          <Line
            key={field}
            type="monotone"
            dataKey={field}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
