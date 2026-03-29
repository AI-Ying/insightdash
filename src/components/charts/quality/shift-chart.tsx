"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import type { ShiftMetrics } from "@/lib/quality-parser";

interface ShiftChartProps {
  data: ShiftMetrics[];
  height?: number;
}

export function ShiftChart({ data, height = 280 }: ShiftChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    // Find data for each shift
    const dayShift = data.find((d) => d.shift === "白班") || { total: 0, good: 0, defect: 0 };
    const nightShift = data.find((d) => d.shift === "夜班") || { total: 0, good: 0, defect: 0 };

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; seriesName: string }[];
          let result = `${p[0].name}<br/>`;
          p.forEach((item) => {
            result += `${item.seriesName}: <strong>${item.value.toLocaleString()}</strong> 件<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ["白班", "夜班"],
        bottom: 0,
        textStyle: {
          fontSize: 12,
          color: "#64748b",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ["总产出", "良品数", "不良数"],
        axisLabel: {
          fontSize: 12,
          color: "#64748b",
        },
        axisLine: {
          lineStyle: {
            color: "#e2e8f0",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "数量 (件)",
        axisLabel: {
          fontSize: 11,
          color: "#94a3b8",
        },
        splitLine: {
          lineStyle: {
            color: "#f1f5f9",
          },
        },
      },
      series: [
        {
          name: "白班",
          type: "bar",
          data: [dayShift.total, dayShift.good, dayShift.defect],
          itemStyle: {
            color: "#f59e0b",
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "30%",
        },
        {
          name: "夜班",
          type: "bar",
          data: [nightShift.total, nightShift.good, nightShift.defect],
          itemStyle: {
            color: "#6366f1",
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "30%",
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ height: `${height}px`, width: "100%" }} />;
}
