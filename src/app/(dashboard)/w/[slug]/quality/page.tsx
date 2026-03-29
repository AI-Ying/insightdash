"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  parseQualityCSV,
  aggregateByWorkshop,
  aggregateByLine,
  calculate24hTrend,
  checkAlerts,
  calculateDefectDistribution,
  getOverallMetrics,
  getWorkshops,
  type QualityRecord,
} from "@/lib/quality-parser";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Minus } from "lucide-react";

export default function QualityDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("全部");
  const [workshops, setWorkshops] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSampleData() {
      try {
        const res = await fetch("/sample/quality-sample.csv");
        const text = await res.text();
        const parsed = parseQualityCSV(text);
        setRecords(parsed);
        setWorkshops(["全部", ...getWorkshops(parsed)]);
      } catch (e) {
        setError("Failed to load sample data");
      } finally {
        setLoading(false);
      }
    }
    loadSampleData();
  }, []);

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

  // Filter records by workshop
  const filteredRecords = selectedWorkshop === "全部"
    ? records
    : records.filter((r) => r.workshop === selectedWorkshop);

  // Calculate metrics
  const overall = getOverallMetrics(filteredRecords);
  const byWorkshop = aggregateByWorkshop(filteredRecords);
  const byLine = aggregateByLine(filteredRecords);
  const trend = calculate24hTrend(filteredRecords);
  const alerts = checkAlerts(filteredRecords);
  const defectDist = calculateDefectDistribution(filteredRecords);

  // Simple bar chart using divs
  const maxDefect = Math.max(...defectDist.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">质量监控大屏</h1>
        <select
          value={selectedWorkshop}
          onChange={(e) => setSelectedWorkshop(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          {workshops.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="良品率"
          value={`${overall.goodRate.toFixed(1)}%`}
          trend={0.5}
          unit="%"
        />
        <KPICard
          title="不良数"
          value={overall.defect.toString()}
          trend={-3}
          unit="件"
        />
        <KPICard
          title="产出总数"
          value={overall.total.toString()}
          trend={0}
          unit="件"
        />
        <KPICard
          title="告警数"
          value={alerts.length.toString()}
          trend={alerts.length > 0 ? 1 : 0}
          unit="条"
          severity={alerts.length > 0 ? "warning" : "normal"}
        />
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">良品率趋势 (24h)</h2>
        <div className="h-48 flex items-end gap-2">
          {trend.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all hover:bg-blue-100"
                style={{
                  height: `${Math.max(t.goodRate, 80)}%`,
                  backgroundColor: t.goodRate >= 95 ? "#22c55e" : t.goodRate >= 90 ? "#eab308" : "#ef4444",
                  minHeight: "4px",
                }}
              />
              <span className="text-xs text-slate-400">{t.hour.slice(-2)}h</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-green-500" /> ≥95%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-yellow-500" /> 90-95%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-red-500" /> &lt;90%
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workshop Ranking */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">车间排名 (不良率)</h2>
          <div className="space-y-3">
            {byWorkshop.map((w, i) => (
              <div key={w.workshop} className="flex items-center gap-3">
                <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{w.workshop}</span>
                    <span className={w.goodRate >= 95 ? "text-green-600" : w.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}>
                      {w.goodRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${w.goodRate}%`,
                        backgroundColor: w.goodRate >= 95 ? "#22c55e" : w.goodRate >= 90 ? "#eab308" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">不良类型分布</h2>
          <div className="space-y-3">
            {defectDist.map((d) => (
              <div key={d.code} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-slate-600">{d.name}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{d.count}件</span>
                    <span>{d.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-3 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(d.count / maxDefect) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            告警列表
          </h2>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  alert.type === "critical" ? "bg-red-100" : "bg-yellow-50"
                }`}
              >
                <AlertTriangle className={`h-4 w-4 ${alert.type === "critical" ? "text-red-600" : "text-yellow-600"}`} />
                <span className="text-sm text-slate-500">{alert.timestamp.slice(11, 16)}</span>
                <span className="text-sm font-medium">{alert.workshop}</span>
                <span className="text-sm text-slate-600">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line Ranking */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">产线排名</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2">车间</th>
                <th className="pb-2">产线</th>
                <th className="pb-2 text-right">良品率</th>
                <th className="pb-2 text-right">不良数</th>
              </tr>
            </thead>
            <tbody>
              {byLine.map((l, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-500">{l.workshop}</td>
                  <td className="py-2 font-medium">{l.line}</td>
                  <td className={`py-2 text-right ${l.goodRate >= 95 ? "text-green-600" : l.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}`}>
                    {l.goodRate.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-slate-500">{l.defect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  unit: string;
  severity?: "normal" | "warning" | "critical";
}

function KPICard({ title, value, trend = 0, unit, severity = "normal" }: KPICardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slate-400";

  const valueColor =
    severity === "critical" ? "text-red-600" :
    severity === "warning" ? "text-yellow-600" :
    "text-slate-900";

  return (
    <div className={`rounded-xl border p-4 ${
      severity === "critical" ? "border-red-200 bg-red-50" :
      severity === "warning" ? "border-yellow-200 bg-yellow-50" :
      "border-slate-200 bg-white"
    }`}>
      <p className="text-sm text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        <span className="text-sm text-slate-400">{unit}</span>
        {trend !== 0 && (
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        )}
      </div>
    </div>
  );
}
