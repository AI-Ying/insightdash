"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  parseQualityCSV,
  type QualityRecord,
  type AggregatedMetrics,
} from "@/lib/quality-parser";
import { SAMPLE_DATA } from "@/lib/constants";
import { ArrowLeft, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface SPCData {
  point: number;
  xBar: number;
  ucl: number;
  lcl: number;
  label: string;
  isOutOfControl: boolean;
}

interface ParetoData {
  code: string;
  name: string;
  count: number;
  cumulative: number;
  cumulativePct: number;
}

export default function QualityAnalysisPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("全部");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(SAMPLE_DATA.QUALITY);
        const text = await res.text();
        const parsed = parseQualityCSV(text);
        setRecords(parsed);
      } catch (e) {
        console.error("加载数据失败", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter records
  const filteredRecords = selectedWorkshop === "全部"
    ? records
    : records.filter((r) => r.workshop === selectedWorkshop);

  // Get unique workshops
  const workshops = ["全部", ...Array.from(new Set(records.map((r) => r.workshop)))];

  // Calculate SPC data (X-bar chart for individual values)
  const spcData: SPCData[] = (() => {
    if (filteredRecords.length === 0) return [];

    // Aggregate by device and timestamp to get rates
    const grouped = new Map<string, { total: number; good: number; count: number }>();
    filteredRecords.forEach((r) => {
      const key = `${r.workshop}-${r.line}-${r.device}`;
      const existing = grouped.get(key) || { total: 0, good: 0, count: 0 };
      grouped.set(key, {
        total: existing.total + r.total,
        good: existing.good + r.good,
        count: existing.count + 1,
      });
    });

    // Calculate rates and statistics
    const rates = Array.from(grouped.values()).map((g) => ({
      rate: g.total > 0 ? (g.good / g.total) * 100 : 0,
      count: g.count,
    }));

    // Calculate overall average
    const xBar = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;

    // Calculate control limits (using moving range method)
    // For simplicity, using ±3σ approximation
    const variance = rates.reduce((sum, r) => sum + Math.pow(r.rate - xBar, 2), 0) / rates.length;
    const sigma = Math.sqrt(variance);
    const ucl = Math.min(100, xBar + 3 * sigma);
    const lcl = Math.max(0, xBar - 3 * sigma);

    // Return first few for display
    return rates.slice(0, 20).map((r, i) => ({
      point: r.rate,
      xBar,
      ucl,
      lcl,
      label: `设备${i + 1}`,
      isOutOfControl: r.rate > ucl || r.rate < lcl,
    }));
  })();

  // Calculate Pareto data
  const paretoData: ParetoData[] = (() => {
    if (filteredRecords.length === 0) return [];

    // Count defects by type
    const defectCounts = new Map<string, number>();
    filteredRecords.forEach((r) => {
      if (r.defectCode) {
        defectCounts.set(r.defectCode, (defectCounts.get(r.defectCode) || 0) + r.defect);
      }
    });

    // Sort by count descending
    const sorted = Array.from(defectCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    // Calculate cumulative
    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    let cumulative = 0;

    return sorted.map(([code, count]) => {
      cumulative += count;
      return {
        code,
        name: getDefectName(code),
        count,
        cumulative,
        cumulativePct: total > 0 ? (cumulative / total) * 100 : 0,
      };
    });
  })();

  // Calculate Cpk (Process Capability Index)
  const cpk = (() => {
    if (spcData.length === 0) return null;
    const ucl = spcData[0].ucl;
    const lcl = spcData[0].lcl;
    const xBar = spcData[0].xBar;
    const sigma = (ucl - xBar) / 3;
    if (sigma === 0) return null;
    // Assuming spec limits are 90% and 100%
    const cpu = (100 - xBar) / (3 * sigma);
    const cpl = (xBar - 90) / (3 * sigma);
    return Math.min(cpu, cpl);
  })();

  // Count out-of-control points
  const outOfControlCount = spcData.filter((d) => d.isOutOfControl).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href={`/w/${slug}/quality`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回质量看板
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SPC & Pareto 分析</h1>
            <p className="text-sm text-slate-500 mt-1">统计过程控制 · 不良品柏拉图分析</p>
          </div>
          <select
            value={selectedWorkshop}
            onChange={(e) => setSelectedWorkshop(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {workshops.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">过程能力指数 Cpk</p>
          <p className={`text-2xl font-bold mt-1 ${cpk && cpk >= 1.33 ? "text-green-600" : cpk && cpk >= 1.0 ? "text-yellow-600" : "text-red-600"}`}>
            {cpk ? cpk.toFixed(2) : "N/A"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {cpk && cpk >= 1.33 ? "过程能力充足" : cpk && cpk >= 1.0 ? "过程能力勉强" : "过程能力不足"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">超控点数</p>
          <p className={`text-2xl font-bold mt-1 ${outOfControlCount === 0 ? "text-green-600" : "text-red-600"}`}>
            {outOfControlCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">超出控制限的点</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">控制上限 UCL</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">
            {spcData[0]?.ucl.toFixed(1) || "N/A"}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">控制下限 LCL</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">
            {spcData[0]?.lcl.toFixed(1) || "N/A"}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SPC Control Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">X-bar 控制图</h2>
            {outOfControlCount > 0 && (
              <span className="flex items-center text-xs text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                存在超控点
              </span>
            )}
          </div>
          
          {spcData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无数据</div>
          ) : (
            <div className="relative h-64">
              {/* Chart area */}
              <div className="absolute inset-0 flex flex-col justify-end">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-evenly">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b border-dashed border-slate-100" />
                  ))}
                </div>

                {/* UCL, X-bar, LCL lines */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {/* UCL line */}
                  <line
                    x1="0"
                    y1={`${100 - ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0)) / ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0) || 1) * 100}%`}
                    x2="100%"
                    y1={`${100 - ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0)) / ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0) || 1) * 100}%`}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  {/* X-bar line */}
                  <line
                    x1="0"
                    y1={`${100 - ((spcData[0]?.xBar || 0) - (spcData[0]?.lcl || 0)) / ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0) || 1) * 100}%`}
                    x2="100%"
                    y1={`${100 - ((spcData[0]?.xBar || 0) - (spcData[0]?.lcl || 0)) / ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0) || 1) * 100}%`}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* LCL line */}
                  <line
                    x1="0"
                    y1="100%"
                    x2="100%"
                    y2="100%"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />

                  {/* Data points */}
                  {spcData.map((d, i) => {
                    const x = (i / (spcData.length - 1)) * 100;
                    const y = 100 - ((d.point - (spcData[0]?.lcl || 0)) / ((spcData[0]?.ucl || 100) - (spcData[0]?.lcl || 0) || 1)) * 100;
                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${Math.max(0, Math.min(100, y))}%`}
                        r="4"
                        fill={d.isOutOfControl ? "#ef4444" : "#3b82f6"}
                        stroke={d.isOutOfControl ? "#dc2626" : "#2563eb"}
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Y-axis labels */}
              <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-slate-400">
                <span>{spcData[0]?.ucl.toFixed(0)}%</span>
                <span>{(spcData[0]?.xBar + (spcData[0]?.ucl! - spcData[0]?.xBar) / 2).toFixed(0)}%</span>
                <span>{spcData[0]?.xBar.toFixed(0)}%</span>
                <span>{(spcData[0]?.lcl + (spcData[0]?.xBar - spcData[0]?.lcl) / 2).toFixed(0)}%</span>
                <span>{spcData[0]?.lcl.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500" /> 数据点</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-blue-600" /> 中心线 (X̄)</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-red-500 border-dashed" /> 控制限 (UCL/LCL)</span>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <Info className="w-4 h-4 inline mr-1" />
              控制图用于监控过程稳定性。点超出控制限或出现连续7点上升/下降趋势时，过程失控需关注。
            </p>
          </div>
        </div>

        {/* Pareto Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Pareto 分析 (不良类型)</h2>

          {paretoData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无数据</div>
          ) : (
            <>
              {/* Bar chart */}
              <div className="relative h-48 mb-4">
                <div className="absolute inset-0 flex items-end gap-2">
                  {paretoData.slice(0, 6).map((d, i) => (
                    <div key={d.code} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${(d.count / (paretoData[0]?.count || 1)) * 100}%` }}
                      />
                      <span className="text-xs text-slate-500 mt-1 truncate w-full text-center">{d.name}</span>
                    </div>
                  ))}
                </div>

                {/* Cumulative line on secondary y-axis */}
                <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-xs text-amber-600">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </div>

              {/* Cumulative table */}
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-2">不良类型</th>
                      <th className="pb-2 text-right">数量</th>
                      <th className="pb-2 text-right">累计</th>
                      <th className="pb-2 text-right">累计%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoData.slice(0, 6).map((d) => (
                      <tr key={d.code} className="border-b border-slate-100">
                        <td className="py-2">
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${d.cumulativePct <= 80 ? "bg-blue-500" : "bg-slate-300"}`} />
                            {d.name}
                          </span>
                        </td>
                        <td className="py-2 text-right">{d.count}</td>
                        <td className="py-2 text-right">{d.cumulative}</td>
                        <td className="py-2 text-right">
                          <span className={d.cumulativePct <= 80 ? "font-medium text-blue-600" : "text-slate-400"}>
                            {d.cumulativePct.toFixed(0)}%
                          </span>
                          {d.cumulativePct <= 80 && <span className="text-xs text-slate-400 ml-1">✓</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  柏拉图分析：前 {paretoData.filter((d) => d.cumulativePct <= 80).length} 项不良类型占累计 {paretoData.find((d) => d.cumulativePct > 80)?.cumulativePct.toFixed(0) || 100}%。
                  优先解决这些关键少数问题可获得最大改善效果。
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Process Analysis Recommendations */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">改善建议</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "重点关注设备",
              desc: outOfControlCount > 0 ? "存在超控点的设备需立即检查" : "所有设备过程稳定",
              color: outOfControlCount > 0 ? "red" : "green",
            },
            {
              title: "不良改善优先级",
              desc: paretoData.length > 0 ? `优先解决 "${paretoData[0]?.name}"，可减少 ${paretoData[0]?.percentage?.toFixed(0) || 0}% 不良` : "暂无数据",
              color: "blue",
            },
            {
              title: "过程能力评估",
              desc: cpk && cpk >= 1.33 ? "Cpk≥1.33，过程能力充足" : cpk && cpk >= 1.0 ? "Cpk≥1.0，建议改善" : "Cpk<1.0，过程能力不足需紧急改善",
              color: "amber",
            },
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-lg ${
              item.color === "red" ? "bg-red-50 border border-red-200" :
              item.color === "green" ? "bg-green-50 border border-green-200" :
              item.color === "blue" ? "bg-blue-50 border border-blue-200" :
              "bg-amber-50 border border-amber-200"
            }`}>
              <h3 className={`font-medium ${
                item.color === "red" ? "text-red-800" :
                item.color === "green" ? "text-green-800" :
                item.color === "blue" ? "text-blue-800" :
                "text-amber-800"
              }`}>{item.title}</h3>
              <p className={`text-sm mt-1 ${
                item.color === "red" ? "text-red-600" :
                item.color === "green" ? "text-green-600" :
                item.color === "blue" ? "text-blue-600" :
                "text-amber-600"
              }`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function
function getDefectName(code: string): string {
  const names: Record<string, string> = {
    P01: "气孔",
    P02: "裂纹",
    P03: "变形",
    P04: "尺寸偏差",
    P05: "外观缺陷",
    P99: "其他",
  };
  return names[code] || code;
}
