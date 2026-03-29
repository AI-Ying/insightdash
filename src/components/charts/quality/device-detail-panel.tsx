"use client";

import { X, Activity } from "lucide-react";
import type { DeviceDetail } from "@/lib/quality-parser";
import { DEFECT_NAMES } from "@/lib/quality-parser";

interface DeviceDetailPanelProps {
  device?: string | null;
  detail: DeviceDetail | null;
  open: boolean;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, detail, open, onClose }: DeviceDetailPanelProps) {
  if (!open || !device) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">{device}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {detail ? (
          <div className="p-4 space-y-6">
            {/* Location */}
            <div className="text-sm text-slate-500">
              {detail.workshop} / {detail.line}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="总产出" value={detail.total.toLocaleString()} unit="件" />
              <MetricCard label="良品数" value={detail.good.toLocaleString()} unit="件" />
              <MetricCard label="不良数" value={detail.defect.toLocaleString()} unit="件" severity={detail.goodRate < 95 ? "warning" : "normal"} />
              <MetricCard
                label="良品率"
                value={`${detail.goodRate.toFixed(1)}%`}
                severity={detail.goodRate >= 95 ? "good" : detail.goodRate >= 90 ? "warning" : "bad"}
              />
            </div>

            {/* Defect Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">不良类型分布</h3>
              <div className="space-y-2">
                {Object.entries(detail.defectBreakdown).map(([code, count]) => (
                  <div key={code} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{DEFECT_NAMES[code] || code}</span>
                    <span className="font-medium text-slate-900">{count} 件</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Records */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">最近记录</h3>
              <div className="space-y-2">
                {detail.records.slice(-5).reverse().map((record, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-slate-500">{record.timestamp.slice(11, 16)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-900">{record.good}/{record.total} 件</div>
                      <div className="text-xs text-slate-400">{record.defectCode} - {DEFECT_NAMES[record.defectCode]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-slate-400">
            加载中...
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  unit,
  severity = "normal",
}: {
  label: string;
  value: string;
  unit?: string;
  severity?: "normal" | "good" | "warning" | "bad";
}) {
  const valueColor =
    severity === "good" ? "text-green-600" :
    severity === "warning" ? "text-yellow-600" :
    severity === "bad" ? "text-red-600" :
    "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
