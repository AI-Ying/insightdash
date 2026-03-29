"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  parseQualityCSV,
  aggregateByWorkshop,
  aggregateByLine,
  aggregateByDevice,
  calculate24hTrend,
  checkAlerts,
  calculateDefectDistribution,
  getOverallMetrics,
  getWorkshops,
  getLines,
  getDevices,
  getDeviceDetail,
  type QualityRecord,
} from "@/lib/quality-parser";
import { DrillDownNav } from "@/components/charts/quality/drill-down-nav";
import { DeviceDetailPanel } from "@/components/charts/quality/device-detail-panel";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Minus, History, ChevronRight } from "lucide-react";

export default function QualityDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  // Get drilldown params from URL
  const workshopParam = searchParams.get("workshop");
  const lineParam = searchParams.get("line");
  const deviceParam = searchParams.get("device");

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

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

  // Get available options
  const workshops = getWorkshops(records);
  const lines = lineParam ? getLines(records, workshopParam || undefined) : [];
  const devices = deviceParam ? getDevices(records, workshopParam || undefined, lineParam || undefined) : [];

  // Filter records based on drilldown level
  const filteredRecords = (() => {
    let result = records;
    if (workshopParam) result = result.filter((r) => r.workshop === workshopParam);
    if (lineParam) result = result.filter((r) => r.line === lineParam);
    return result;
  })();

  // Calculate metrics
  const overall = getOverallMetrics(filteredRecords);
  const byWorkshop = aggregateByWorkshop(records); // Always from all records
  const byLine = workshopParam ? aggregateByLine(records, workshopParam) : [];
  const byDevice = lineParam ? aggregateByDevice(records, workshopParam || undefined) : [];
  const trend = calculate24hTrend(filteredRecords);
  const alerts = checkAlerts(filteredRecords);
  const defectDist = calculateDefectDistribution(filteredRecords);

  // Device detail
  const deviceDetail = deviceParam && workshopParam && lineParam
    ? getDeviceDetail(records, workshopParam, lineParam, deviceParam)
    : null;

  // Current level
  const currentLevel = deviceParam ? "device" : lineParam ? "line" : workshopParam ? "workshop" : "factory";

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

  const maxDefect = defectDist.length > 0 ? Math.max(...defectDist.map((d) => d.count), 1) : 1;

  // Build URL helper
  const buildUrl = (opts: { workshop?: string; line?: string; device?: string }) => {
    const params = new URLSearchParams();
    if (opts.workshop) params.set("workshop", opts.workshop);
    if (opts.line) params.set("line", opts.line);
    if (opts.device) params.set("device", opts.device);
    const query = params.toString();
    return `/w/${slug}/quality${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">质量监控大屏</h1>
          <DrillDownNav
            workshop={workshopParam}
            line={lineParam}
            device={deviceParam}
            workspaceSlug={slug}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Workshop selector */}
          <select
            value={workshopParam || ""}
            onChange={(e) => {
              const w = e.target.value;
              window.location.href = w ? buildUrl({ workshop: w }) : buildUrl({});
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">全部车间</option>
            {workshops.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          {/* History link */}
          <Link
            href={`/w/${slug}/quality/history`}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            历史分析
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="良品率" value={`${overall.goodRate.toFixed(1)}%`} trend={0.5} unit="%" />
        <KPICard title="不良数" value={overall.defect.toString()} trend={-3} unit="件" />
        <KPICard title="产出总数" value={overall.total.toString()} trend={0} unit="件" />
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
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-500" /> ≥95%</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-yellow-500" /> 90-95%</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> &lt;90%</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workshop/Line Ranking (clickable) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {currentLevel === "factory" ? "车间排名" : currentLevel === "workshop" ? "产线排名" : "设备排名"}
          </h2>
          <div className="space-y-2">
            {(currentLevel === "factory" ? byWorkshop : currentLevel === "workshop" ? byLine : byDevice).map((item, i) => {
              const name = item.workshop; // For workshop level
              const linkLine = currentLevel === "factory" ? buildUrl({ workshop: (item as typeof byWorkshop[0]).workshop }) : undefined;
              const linkDevice = currentLevel === "workshop" ? buildUrl({ workshop: workshopParam!, line: (item as typeof byLine[0]).line }) : undefined;
              const href = linkLine || linkDevice;

              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                  {href ? (
                    <Link href={href} className="flex-1 flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="font-medium text-slate-700">{name}</span>
                      <div className="flex items-center gap-2">
                        <span className={item.goodRate >= 95 ? "text-green-600" : item.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}>
                          {item.goodRate.toFixed(1)}%
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </Link>
                  ) : (
                    <div className="flex-1 flex items-center justify-between p-2">
                      <span className="font-medium text-slate-700">{name}</span>
                      <span className={item.goodRate >= 95 ? "text-green-600" : item.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}>
                        {item.goodRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
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
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(d.count / maxDefect) * 100}%` }} />
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
              <div key={i} className={`flex items-center gap-3 rounded-lg p-3 ${alert.type === "critical" ? "bg-red-100" : "bg-yellow-50"}`}>
                <AlertTriangle className={`h-4 w-4 ${alert.type === "critical" ? "text-red-600" : "text-yellow-600"}`} />
                <span className="text-sm text-slate-500">{alert.timestamp.slice(11, 16)}</span>
                <span className="text-sm font-medium">{alert.workshop}</span>
                <span className="text-sm text-slate-600">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line/Device Table (for workshop/line level) */}
      {currentLevel !== "factory" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {currentLevel === "workshop" ? "产线明细" : "设备明细"}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2">{currentLevel === "workshop" ? "车间" : "产线"}</th>
                  <th className="pb-2">{currentLevel === "workshop" ? "产线" : "设备"}</th>
                  <th className="pb-2 text-right">良品率</th>
                  <th className="pb-2 text-right">不良数</th>
                  {currentLevel === "line" && <th className="pb-2"></th>}
                </tr>
              </thead>
              <tbody>
                {(currentLevel === "workshop" ? byLine : byDevice).map((item, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-500">{item.workshop}</td>
                    <td className="py-2 font-medium">{item.line || item.device}</td>
                    <td className={`py-2 text-right ${item.goodRate >= 95 ? "text-green-600" : item.goodRate >= 90 ? "text-yellow-600" : "text-red-600"}`}>
                      {item.goodRate.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right text-slate-500">{item.defect}</td>
                    {currentLevel === "line" && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setSelectedDevice((item as typeof byDevice[0]).device || null)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          详情
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device Detail Panel */}
      <DeviceDetailPanel
        device={selectedDevice}
        detail={selectedDevice && workshopParam && lineParam ? getDeviceDetail(records, workshopParam, lineParam, selectedDevice) : null}
        open={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
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
    <div className={`rounded-xl border p-4 ${severity === "critical" ? "border-red-200 bg-red-50" : severity === "warning" ? "border-yellow-200 bg-yellow-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        <span className="text-sm text-slate-400">{unit}</span>
        {trend !== 0 && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
    </div>
  );
}
