"use client";

import { useState } from "react";
import { Database, BarChart3, Sparkles, Loader2 } from "lucide-react";

interface SampleDataLoaderProps {
  workspaceId: string;
  slug: string;
  hasData: boolean;
}

export function SampleDataLoader({ workspaceId, slug, hasData }: SampleDataLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleLoadSample = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/init-sample`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400 && data.error === "Sample data already exists") {
          setDone(true);
          window.location.href = `/w/${slug}/dashboards/${data.dataSourceId}`;
          return;
        }
        throw new Error(data.error || "Failed to load sample data");
      }
      
      setDone(true);
      // Redirect to the sample dashboard
      window.location.href = `/w/${slug}/dashboards/${data.dashboardId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sample data");
    } finally {
      setLoading(false);
    }
  };

  if (done || hasData) {
    return null;
  }

  return (
    <div className="mt-8 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-blue-100 p-3">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-800">
            快速开始 - 加载示例数据
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            不确定从哪里开始？加载示例传感器数据，我们将自动为你创建一个预配置好的监控仪表板。
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  加载示例数据
                </>
              )}
            </button>
            <Link
              href={`/w/${slug}/datasources`}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Database className="h-4 w-4" />
              上传自己的 CSV
            </Link>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-blue-200 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          温度/压力/流量趋势图
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          设备告警分布
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          KPI 关键指标卡片
        </div>
      </div>
    </div>
  );
}

// Need to import Link
import Link from "next/link";
