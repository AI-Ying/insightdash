"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Upload,
  Link2,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DataSource {
  id: string;
  type: "csv" | "api" | "mqtt";
  name: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  config: Record<string, string>;
}

const MOCK_DATASOURCES: DataSource[] = [
  {
    id: "1",
    type: "csv",
    name: "质检样本数据",
    status: "connected",
    lastSync: "2026-03-29 22:00",
    config: { file: "sample/quality-sample.csv" },
  },
  {
    id: "2",
    type: "api",
    name: "MES系统接口",
    status: "disconnected",
    config: { url: "https://api.factory.com/quality" },
  },
  {
    id: "3",
    type: "mqtt",
    name: "产线实时数据",
    status: "error",
    lastSync: "2026-03-29 10:30",
    config: { broker: "mqtt://iot.factory.com:1883", topic: "factory/quality/#" },
  },
];

export default function QualitySettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [dataSources, setDataSources] = useState<DataSource[]>(MOCK_DATASOURCES);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (id: string) => {
    setSyncing(id);
    await new Promise((r) => setTimeout(r, 2000));
    setDataSources((ds) =>
      ds.map((d) => (d.id === id ? { ...d, lastSync: new Date().toISOString().slice(0, 16).replace("T", " ") } : d))
    );
    setSyncing(null);
  };

  const getStatusIcon = (status: DataSource["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-slate-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: DataSource["type"]) => {
    switch (type) {
      case "csv":
        return <Upload className="w-5 h-5" />;
      case "api":
        return <Link2 className="w-5 h-5" />;
      case "mqtt":
        return <RefreshCw className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: DataSource["type"]) => {
    switch (type) {
      case "csv":
        return "CSV文件";
      case "api":
        return "API接口";
      case "mqtt":
        return "MQTT实时";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href={`/w/${slug}/quality`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回质量看板
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">质量数据源</h1>
          <p className="text-sm text-slate-500 mt-1">配置质量数据的来源和同步方式</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900">上传CSV</p>
            <p className="text-xs text-slate-500">导入本地质量数据</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900">连接API</p>
            <p className="text-xs text-slate-500">对接MES/ERP系统</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900">配置MQTT</p>
            <p className="text-xs text-slate-500">实时数据采集</p>
          </div>
        </button>
      </div>

      {/* Data Sources List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-400" />
            已配置的数据源
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {dataSources.map((ds) => (
            <div key={ds.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  ds.status === "connected" ? "bg-green-100 text-green-600" :
                  ds.status === "error" ? "bg-red-100 text-red-600" :
                  "bg-slate-100 text-slate-400"
                }`}>
                  {getTypeIcon(ds.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{ds.name}</p>
                    {getStatusIcon(ds.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{getTypeName(ds.type)}</span>
                    {ds.lastSync && <span>同步于 {ds.lastSync}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ds.status === "connected" && (
                  <button
                    onClick={() => handleSync(ds.id)}
                    disabled={syncing === ds.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === ds.id ? "animate-spin" : ""}`} />
                    {syncing === ds.id ? "同步中..." : "同步"}
                  </button>
                )}
                <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  配置
                </button>
                <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {dataSources.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无配置的数据源</p>
            <p className="text-sm">点击上方按钮添加</p>
          </div>
        )}
      </div>

      {/* Data Mapping */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">数据字段映射</h2>
        <p className="text-sm text-slate-500 mb-4">
          配置从数据源获取的数据如何映射到质量分析字段
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">质量字段</th>
                <th className="pb-2 font-medium">数据源字段</th>
                <th className="pb-2 font-medium">示例值</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                { field: "时间戳", source: "timestamp", example: "2026-03-29 14:30:00" },
                { field: "车间", source: "workshop", example: "压铸车间" },
                { field: "产线", source: "line", example: "压铸岛1" },
                { field: "设备", source: "device", example: "CZ-001" },
                { field: "总产出", source: "total", example: "120" },
                { field: "良品数", source: "good", example: "115" },
                { field: "不良品数", source: "defect", example: "5" },
                { field: "不良代码", source: "defect_code", example: "P01" },
              ].map((row) => (
                <tr key={row.field} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{row.field}</td>
                  <td className="py-2">
                    <input
                      type="text"
                      defaultValue={row.source}
                      className="px-2 py-1 border border-slate-200 rounded text-xs w-32"
                    />
                  </td>
                  <td className="py-2 text-slate-400">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            保存映射
          </button>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          同步与告警设置
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">自动同步</p>
              <p className="text-sm text-slate-500">定期从数据源获取最新数据</p>
            </div>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="5">每5分钟</option>
              <option value="15">每15分钟</option>
              <option value="30">每30分钟</option>
              <option value="60">每小时</option>
              <option value="manual">手动</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">实时告警</p>
              <p className="text-sm text-slate-500">当不良率超标时立即通知</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">数据保留</p>
              <p className="text-sm text-slate-500">历史数据的保留时长</p>
            </div>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="7">7天</option>
              <option value="30" selected>30天</option>
              <option value="90">90天</option>
              <option value="365">1年</option>
              <option value="forever">永久</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
