"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import type { DailyMetrics, WeeklyMetrics, MonthlyMetrics } from "@/lib/quality-parser";

type TrendData = DailyMetrics | WeeklyMetrics | MonthlyMetrics;

interface TrendChartProps {
  data: TrendData[];
  granularity: "day" | "week" | "month";
  height?: number;
}

export function TrendChart({ data, granularity, height = 300 }: TrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Init chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    // Prepare data
    const xData = data.map((d) => {
      if (granularity === "day") return (d as DailyMetrics).date.slice(5); // MM-DD
      if (granularity === "week") return (d as WeeklyMetrics).week;
      return (d as MonthlyMetrics).month; // YYYY-MM
    });
    const yData = data.map((d) => parseFloat(d.goodRate.toFixed(1)));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `${p.name}<br/>良品率: <strong>${p.value}%</strong>`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xData,
        boundaryGap: false,
        axisLabel: {
          fontSize: 11,
          color: "#94a3b8",
        },
        axisLine: {
          lineStyle: {
            color: "#e2e8f0",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "良品率 (%)",
        min: 80,
        max: 100,
        axisLabel: {
          fontSize: 11,
          color: "#94a3b8",
          formatter: "{value}%",
        },
        splitLine: {
          lineStyle: {
            color: "#f1f5f9",
          },
        },
      },
      series: [
        {
          type: "line",
          data: yData,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: {
            width: 2,
            color: "#3b82f6",
          },
          itemStyle: {
            color: "#3b82f6",
            borderWidth: 2,
            borderColor: "#fff",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
              { offset: 1, color: "rgba(59, 130, 246, 0)" },
            ]),
          },
          markLine: {
            silent: true,
            data: [
              {
                yAxis: 95,
                lineStyle: { color: "#22c55e", type: "dashed" },
                label: { formatter: "目标 95%", position: "end" },
              },
              {
                yAxis: 90,
                lineStyle: { color: "#ef4444", type: "dashed" },
                label: { formatter: "警戒 90%", position: "end" },
              },
            ],
          },
        },
      ],
    };

    chart.setOption(option);

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, granularity]);

  return <div ref={chartRef} style={{ height: `${height}px`, width: "100%" }} />;
}
