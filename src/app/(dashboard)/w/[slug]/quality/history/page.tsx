"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  parseQualityCSV,
  aggregateByDay,
  aggregateByWeek,
  aggregateByMonth,
  aggregateByShift,
  parseDate,
  type QualityRecord,
} from "@/lib/quality-parser";
import { TimeRangeSelector, getDateRange, type TimeRange } from "@/components/charts/quality/time-range-selector";
import { TrendChart } from "@/components/charts/quality/trend-chart";
import { ShiftChart } from "@/components/charts/quality/shift-chart";
import { ArrowLeft } from "lucide-react";

type Granularity = "day" | "week" | "month";

export default function QualityHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [granularity, setGranularity] = useState<Granularity>("day");

  useEffect(() => {
    async function loadSampleData() {
      try {
        const res = await fetch("/sample/quality-sample.csv");
        const text = await res.text();
        const parsed = parseQualityCSV(text);
        setRecords(parsed);
      } catch (e) {
        setError("加载示例数据失败");
      } finally {
        setLoading(false);
      }
    }
    loadSampleData();
  }, []);

  // Filter records by time range
  const dateRange = getDateRange(timeRange, customRange);
  const filteredRecords = records.filter((r) => {
    const date = parseDate(r.timestamp);
    return date >= dateRange.start && date <= dateRange.end;
  });

  // Get aggregated data based on granularity
  const trendData = (() => {
    if (granularity === "day") return aggregateByDay(filteredRecords);
    if (granularity === "week") return aggregateByWeek(filteredRecords);
    return aggregateByMonth(filteredRecords);
  })();

  // Shift comparison
  const shiftData = aggregateByShift(filteredRecords);

  // Overall stats
  const total = filteredRecords.reduce((sum, r) => sum + r.total, 0);
  const good = filteredRecords.reduce((sum, r) => sum + r.good, 0);
  const defect = filteredRecords.reduce((sum, r) => sum + r.defect, 0);
  const goodRate = total > 0 ? (good / total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/w/${slug}/quality`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">返回质量大屏</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">历史分析</h1>
      </div>

      {/* Time Range Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <TimeRangeSelector
          value={timeRange}
          customRange={customRange}
          onChange={(range, custom) => {
            setTimeRange(range);
            if (custom) setCustomRange(custom);
          }}
        />
      </div>

      {/* Granularity Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        <button
          onClick={() => setGranularity("day")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            granularity === "day" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          按日
        </button>
        <button
          onClick={() => setGranularity("week")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            granularity === "week" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          按周
        </button>
        <button
          onClick={() => setGranularity("month")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            granularity === "month" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          按月
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">时间范围</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {dateRange.start} 至 {dateRange.end}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">总产出</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{total.toLocaleString()} 件</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">总良品</p>
          <p className="mt-1 text-lg font-semibold text-green-600">{good.toLocaleString()} 件</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">平均良品率</p>
          <p className={`mt-1 text-lg font-semibold ${goodRate >= 95 ? "text-green-600" : goodRate >= 90 ? "text-yellow-600" : "text-red-600"}`}>
            {goodRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          良品率趋势 ({granularity === "day" ? "按日" : granularity === "week" ? "按周" : "按月"})
        </h2>
        {trendData.length > 0 ? (
          <TrendChart data={trendData} granularity={granularity} height={300} />
        ) : (
          <div className="flex items-center justify-center h-60 text-slate-400">
            暂无数据
          </div>
        )}
      </div>

      {/* Shift Comparison */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">班次对比 (白班 vs 夜班)</h2>
        <p className="text-sm text-slate-500 mb-4">
          白班: 08:00-20:00 | 夜班: 20:00-次日 08:00
        </p>
        {shiftData.some((d) => d.total > 0) ? (
          <ShiftChart data={shiftData} height={280} />
        ) : (
          <div className="flex items-center justify-center h-60 text-slate-400">
            暂无班次数据
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">明细数据</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2">{granularity === "day" ? "日期" : granularity === "week" ? "周" : "月份"}</th>
                <th className="pb-2 text-right">总产出</th>
                <th className="pb-2 text-right">良品</th>
                <th className="pb-2 text-right">不良</th>
                <th className="pb-2 text-right">良品率</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-slate-700">
                    {"date" in row ? row.date : "week" in row ? row.week : row.month}
                  </td>
                  <td className="py-2 text-right text-slate-500">{row.total.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-500">{row.good.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-500">{row.defect.toLocaleString()}</td>
                  <td className={`py-2 text-right font-medium ${row.goodRate >= 95 ? "text-green-600" : row.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}`}>
                    {row.goodRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trendData.length === 0 && (
          <div className="py-8 text-center text-slate-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}
