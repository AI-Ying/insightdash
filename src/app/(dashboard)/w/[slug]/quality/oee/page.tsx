"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  parseQualityCSV,
  type QualityRecord,
  getWorkshops,
  getLines,
  getDevices,
} from "@/lib/quality-parser";
import { SAMPLE_DATA } from "@/lib/constants";
import { ArrowLeft, Activity, Clock, Target, Zap } from "lucide-react";

interface OEEData {
  device: string;
  line: string;
  availability: number;    // 时间稼动率
  performance: number;     // 性能稼动率
  quality: number;         // 良品率
  oee: number;             // OEE = A × P × Q
}

export default function OEEPage() {
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

  const workshops = ["全部", ...Array.from(new Set(records.map((r) => r.workshop)))];
  const filteredRecords = selectedWorkshop === "全部"
    ? records
    : records.filter((r) => r.workshop === selectedWorkshop);

  // Calculate OEE per device
  const oeeData: OEEData[] = (() => {
    const deviceMap = new Map<string, { total: number; good: number; defect: number; line: string }>();

    filteredRecords.forEach((r) => {
      const existing = deviceMap.get(r.device) || { total: 0, good: 0, defect: 0, line: r.line };
      deviceMap.set(r.device, {
        total: existing.total + r.total,
        good: existing.good + r.good,
        defect: existing.defect + r.defect,
        line: existing.line,
      });
    });

    // Simulate A (Availability) and P (Performance) based on defect patterns
    // In real implementation, these would come from PLC/scada data
    return Array.from(deviceMap.entries()).map(([device, data]) => {
      // Simulated values (in production, these come from actual measurements)
      const availability = 85 + Math.random() * 10; // 85-95%
      const performance = 80 + Math.random() * 15;  // 80-95%
      const quality = data.total > 0 ? (data.good / data.total) * 100 : 0;
      const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        device,
        line: data.line,
        availability,
        performance,
        quality,
        oee,
      };
    }).sort((a, b) => b.oee - a.oee);
  })();

  // Calculate averages
  const avgOEE = oeeData.length > 0 ? oeeData.reduce((sum, d) => sum + d.oee, 0) / oeeData.length : 0;
  const avgAvailability = oeeData.length > 0 ? oeeData.reduce((sum, d) => sum + d.availability, 0) / oeeData.length : 0;
  const avgPerformance = oeeData.length > 0 ? oeeData.reduce((sum, d) => sum + d.performance, 0) / oeeData.length : 0;
  const avgQuality = oeeData.length > 0 ? oeeData.reduce((sum, d) => sum + d.quality, 0) / oeeData.length : 0;

  // World-class OEE benchmark
  const getOEEGrade = (oee: number) => {
    if (oee >= 85) return { grade: "A", color: "text-green-600", bg: "bg-green-100", label: "世界级" };
    if (oee >= 70) return { grade: "B", color: "text-blue-600", bg: "bg-blue-100", label: "良好" };
    if (oee >= 60) return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-100", label: "一般" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-100", label: "需改善" };
  };

  // Losses breakdown (simulated)
  const losses = {
    availability: 100 - avgAvailability,
    performance: 100 - avgPerformance,
    quality: 100 - avgQuality,
  };

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
            <h1 className="text-2xl font-bold text-slate-900">OEE 设备综合效率</h1>
            <p className="text-sm text-slate-500 mt-1">Overall Equipment Effectiveness 分析</p>
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

      {/* OEE Formula */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="font-medium text-blue-800">OEE =</span>
          <span className="px-3 py-1 bg-white rounded-lg shadow-sm">时间稼动率</span>
          <span className="text-blue-600 font-bold">×</span>
          <span className="px-3 py-1 bg-white rounded-lg shadow-sm">性能稼动率</span>
          <span className="text-blue-600 font-bold">×</span>
          <span className="px-3 py-1 bg-white rounded-lg shadow-sm">良品率</span>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-blue-600">
          <span>可用性 {avgAvailability.toFixed(1)}%</span>
          <span>+</span>
          <span>性能 {avgPerformance.toFixed(1)}%</span>
          <span>+</span>
          <span>质量 {avgQuality.toFixed(1)}%</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
          <p className="text-sm opacity-80">平均 OEE</p>
          <p className="text-4xl font-bold mt-2">{avgOEE.toFixed(1)}%</p>
          <p className="text-xs opacity-80 mt-1">{getOEEGrade(avgOEE).label}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">时间稼动率</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgAvailability.toFixed(1)}%</p>
          <p className="text-xs text-red-500 mt-1">损失: {losses.availability.toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm">性能稼动率</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgPerformance.toFixed(1)}%</p>
          <p className="text-xs text-red-500 mt-1">损失: {losses.performance.toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">良品率</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgQuality.toFixed(1)}%</p>
          <p className="text-xs text-red-500 mt-1">损失: {losses.quality.toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">设备数量</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{oeeData.length}</p>
          <p className="text-xs text-slate-400 mt-1">参与计算</p>
        </div>
      </div>

      {/* Device OEE Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">设备 OEE 明细</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-6 py-3 font-medium">设备</th>
                <th className="px-6 py-3 font-medium">产线</th>
                <th className="px-6 py-3 font-medium text-center">OEE</th>
                <th className="px-6 py-3 font-medium text-center">等级</th>
                <th className="px-6 py-3 font-medium text-center">时间稼动</th>
                <th className="px-6 py-3 font-medium text-center">性能稼动</th>
                <th className="px-6 py-3 font-medium text-center">良品率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {oeeData.map((d) => {
                const grade = getOEEGrade(d.oee);
                return (
                  <tr key={d.device} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{d.device}</td>
                    <td className="px-6 py-4 text-slate-500">{d.line}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              d.oee >= 85 ? "bg-green-500" :
                              d.oee >= 70 ? "bg-blue-500" :
                              d.oee >= 60 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${d.oee}%` }}
                          />
                        </div>
                        <span className="font-medium">{d.oee.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${grade.bg} ${grade.color}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{d.availability.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center text-slate-600">{d.performance.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={d.quality >= 95 ? "text-green-600" : d.quality >= 90 ? "text-yellow-600" : "text-red-600"}>
                        {d.quality.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {oeeData.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            暂无设备数据
          </div>
        )}
      </div>

      {/* Loss Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OEE Loss Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">OEE 损失分析</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">时间损失 (停机、换模等)</span>
                <span className="font-medium">{losses.availability.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: `${losses.availability}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">性能损失 (速度下降、空转等)</span>
                <span className="font-medium">{losses.performance.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${losses.performance}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">质量损失 (不良品、返工等)</span>
                <span className="font-medium">{losses.quality.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${losses.quality}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>理论最大 OEE:</strong> 100% × 100% × 100% = <strong>100%</strong>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              <strong>当前实际 OEE:</strong> {avgAvailability.toFixed(1)}% × {avgPerformance.toFixed(1)}% × {avgQuality.toFixed(1)}% = <strong className="text-blue-600">{avgOEE.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">改善建议</h3>
          
          <div className="space-y-3">
            {losses.availability > 10 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800 text-sm">时间稼动率偏低</p>
                <p className="text-xs text-red-600 mt-1">
                  建议：减少停机时间，优化换模流程，实施预测性维护
                </p>
              </div>
            )}
            
            {losses.performance > 10 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-medium text-orange-800 text-sm">性能稼动率偏低</p>
                <p className="text-xs text-orange-600 mt-1">
                  建议：提高设备速度，减少空转时间，优化工艺参数
                </p>
              </div>
            )}
            
            {losses.quality > 5 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800 text-sm">良品率偏低</p>
                <p className="text-xs text-yellow-600 mt-1">
                  建议：查看 SPC 控制图，分析不良原因，实施质量改善
                </p>
              </div>
            )}
            
            {avgOEE >= 85 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800 text-sm">已达世界级水平</p>
                <p className="text-xs text-green-600 mt-1">
                 继续保持！定期监控，持续改进
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">
              <strong>OEE 基准:</strong> 世界级制造 OEE ≥ 85%，良好 70-85%，一般 60-70%，需改善 &lt;60%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
