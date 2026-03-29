"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  parseQualityCSV,
  type QualityRecord,
  getWorkshops,
} from "@/lib/quality-parser";
import { SAMPLE_DATA } from "@/lib/constants";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

interface ShiftMetrics {
  shift: string;
  total: number;
  good: number;
  defect: number;
  goodRate: number;
  trend: number; // vs previous period
}

export default function ShiftComparisonPage() {
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

  // Get unique workshops
  const workshops = ["全部", ...Array.from(new Set(records.map((r) => r.workshop)))];

  // Filter records
  const filteredRecords = selectedWorkshop === "全部"
    ? records
    : records.filter((r) => r.workshop === selectedWorkshop);

  // Aggregate by shift
  const shiftMetrics: ShiftMetrics[] = (() => {
    const shiftMap = new Map<string, { total: number; good: number; defect: number }>();

    filteredRecords.forEach((r) => {
      // Determine shift from timestamp
      const hour = new Date(r.timestamp).getHours();
      let shift = "晚班";
      if (hour >= 6 && hour < 14) shift = "早班";
      else if (hour >= 14 && hour < 22) shift = "中班";

      const existing = shiftMap.get(shift) || { total: 0, good: 0, defect: 0 };
      shiftMap.set(shift, {
        total: existing.total + r.total,
        good: existing.good + r.good,
        defect: existing.defect + r.defect,
      });
    });

    return Array.from(shiftMap.entries()).map(([shift, data]) => ({
      shift,
      total: data.total,
      good: data.good,
      defect: data.defect,
      goodRate: data.total > 0 ? (data.good / data.total) * 100 : 0,
      trend: 0, // Would need historical data to calculate
    }));
  })();

  // Calculate best and worst
  const bestShift = shiftMetrics.reduce((best, s) => s.goodRate > best.goodRate ? s : best, shiftMetrics[0]);
  const worstShift = shiftMetrics.reduce((worst, s) => s.goodRate < worst.goodRate ? s : worst, shiftMetrics[0]);

  // Defect rate by shift
  const getDefectRate = (shift: string) => {
    const m = shiftMetrics.find((s) => s.shift === shift);
    return m ? (m.defect / m.total) * 100 : 0;
  };

  // Get max for scaling
  const maxRate = Math.max(...shiftMetrics.map((s) => s.goodRate), 1);

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
            <h1 className="text-2xl font-bold text-slate-900">班次对比分析</h1>
            <p className="text-sm text-slate-500 mt-1">比较早班/中班/晚班的质量表现</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shiftMetrics.map((shift) => {
          const isBest = shift.shift === bestShift?.shift;
          const isWorst = shift.shift === worstShift?.shift;
          return (
            <div
              key={shift.shift}
              className={`rounded-xl border p-6 ${
                isBest ? "border-green-300 bg-green-50" :
                isWorst ? "border-red-300 bg-red-50" :
                "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-bold ${
                    isBest ? "text-green-700" :
                    isWorst ? "text-red-700" :
                    "text-slate-900"
                  }`}>
                    {shift.shift}
                  </p>
                  {isBest && <span className="text-xs text-green-600 font-medium">✓ 最佳</span>}
                  {isWorst && <span className="text-xs text-red-600 font-medium">⚠ 需关注</span>}
                </div>
                <div className={`text-3xl font-bold ${
                  isBest ? "text-green-600" :
                  isWorst ? "text-red-600" :
                  "text-slate-700"
                }`}>
                  {shift.goodRate.toFixed(1)}%
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">产出</span>
                  <span className="font-medium">{shift.total} 件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">良品</span>
                  <span className="font-medium text-green-600">{shift.good} 件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">不良</span>
                  <span className="font-medium text-red-600">{shift.defect} 件</span>
                </div>
              </div>

              {/* Mini bar */}
              <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isBest ? "bg-green-500" :
                    isWorst ? "bg-red-500" :
                    "bg-blue-500"
                  }`}
                  style={{ width: `${(shift.goodRate / maxRate) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">良品率对比</h2>
        
        <div className="space-y-6">
          {shiftMetrics.map((shift) => {
            const barWidth = (shift.goodRate / 100) * 100;
            return (
              <div key={shift.shift} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-slate-700">{shift.shift}</div>
                <div className="flex-1">
                  <div className="h-8 bg-slate-100 rounded-lg relative overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all ${
                        shift.shift === bestShift?.shift ? "bg-green-500" :
                        shift.shift === worstShift?.shift ? "bg-red-500" :
                        "bg-blue-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-3">
                      <span className="text-sm font-bold text-slate-700">
                        {shift.goodRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className={`text-sm ${
                    shift.shift === bestShift?.shift ? "text-green-600" :
                    shift.shift === worstShift?.shift ? "text-red-600" :
                    "text-slate-500"
                  }`}>
                    {shift.shift === bestShift?.shift ? "最优" :
                     shift.shift === worstShift?.shift ? "待改善" : "正常"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Defect Rate Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">不良率对比</h2>
        
        <div className="space-y-6">
          {shiftMetrics.map((shift) => {
            const defectRate = (shift.defect / shift.total) * 100;
            const barWidth = defectRate * 5; // Scale for visibility
            return (
              <div key={shift.shift} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-slate-700">{shift.shift}</div>
                <div className="flex-1">
                  <div className="h-8 bg-slate-100 rounded-lg relative overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all ${
                        shift.shift === worstShift?.shift ? "bg-red-400" :
                        "bg-orange-400"
                      }`}
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-3">
                      <span className="text-sm font-bold text-slate-700">
                        {defectRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right text-sm text-slate-500">
                  {shift.defect} 件
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <h3 className="font-semibold text-amber-800 mb-3">改善建议</h3>
        {worstShift && bestShift && worstShift.shift !== bestShift.shift ? (
          <div className="space-y-2 text-sm text-amber-700">
            <p>
              <span className="font-medium">{worstShift.shift}</span> 良品率最低 (
              {worstShift.goodRate.toFixed(1)}%)，
              比 <span className="font-medium">{bestShift.shift}</span> (
              {bestShift.goodRate.toFixed(1)}%) 低
              {(bestShift.goodRate - worstShift.goodRate).toFixed(1)}%。
            </p>
            <p>建议对比两个班次的操作差异：</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>人员配置和培训情况</li>
              <li>设备维护状态</li>
              <li>原材料批次差异</li>
              <li>工艺参数执行情况</li>
            </ul>
          </div>
        ) : (
          <p className="text-sm text-amber-700">各班次表现较为均衡，继续保持。</p>
        )}
      </div>
    </div>
  );
}
