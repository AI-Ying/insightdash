"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { WidgetConfig, DatasetSchema, DatasetColumn } from "@/lib/types";

interface DatasetOption {
  id: string;
  name: string;
  schema: DatasetSchema | string | null;
}

interface WidgetConfigPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    type: string;
    config: WidgetConfig;
    position: { col: number; row: number; w: number; h: number };
    datasetId?: string;
  }) => void;
  datasets: DatasetOption[];
  initialData?: {
    id?: string;
    title: string;
    type: string;
    config: WidgetConfig;
    position: { col: number; row: number; w: number; h: number };
    datasetId?: string | null;
  };
  widgetCount: number;
}

const CHART_TYPES = [
  { value: "BAR_CHART", label: "柱状图" },
  { value: "LINE_CHART", label: "折线图" },
  { value: "PIE_CHART", label: "饼图" },
  { value: "AREA_CHART", label: "面积图" },
  { value: "KPI_CARD", label: "KPI 指标卡" },
];

export function WidgetConfigPanel({
  open,
  onClose,
  onSave,
  datasets,
  initialData,
  widgetCount,
}: WidgetConfigPanelProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("BAR_CHART");
  const [datasetId, setDatasetId] = useState<string>("");
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [yFields, setYFields] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<string>("sum");
  const [width, setWidth] = useState(1);

  const selectedDataset = datasets.find((d) => d.id === datasetId);
  const rawSchema = selectedDataset?.schema;
  const parsedSchema = typeof rawSchema === "string" ? (() => { try { return JSON.parse(rawSchema); } catch { return null; } })() : rawSchema;
  const columns: DatasetColumn[] = parsedSchema?.columns || [];
  const stringColumns = columns.filter((c) => c.type === "string");
  const numberColumns = columns.filter((c) => c.type === "number");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setType(initialData.type);
      setDatasetId(initialData.datasetId || "");
      setXField(initialData.config.xField || initialData.config.categoryField || "");
      setYField(initialData.config.yField || initialData.config.valueField || "");
      setYFields(initialData.config.yFields || []);
      setAggregation(initialData.config.aggregation || "sum");
      setWidth(initialData.position.w);
    } else {
      setTitle("");
      setType("BAR_CHART");
      setDatasetId(datasets[0]?.id || "");
      setXField("");
      setYField("");
      setYFields([]);
      setAggregation("sum");
      setWidth(1);
    }
  }, [initialData, datasets, open]);

  // Auto-select first string/number columns when dataset changes
  useEffect(() => {
    if (stringColumns.length > 0 && !xField) {
      setXField(stringColumns[0].name);
    }
    if (numberColumns.length > 0 && !yField) {
      setYField(numberColumns[0].name);
      if (numberColumns.length > 1) {
        setYFields(numberColumns.slice(0, 2).map((c: { name: string }) => c.name));
      }
    }
  }, [datasetId, stringColumns.length, numberColumns.length]);

  const handleYFieldToggle = (field: string) => {
    setYFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSave = () => {
    const config: WidgetConfig = {};

    if (type === "KPI_CARD") {
      config.valueField = yField;
      config.aggregation = aggregation as WidgetConfig["aggregation"];
    } else if (type === "PIE_CHART") {
      config.categoryField = xField;
      config.valueField = yField;
    } else {
      config.xField = xField;
      if (yFields.length > 1) {
        config.yFields = yFields;
      } else {
        config.yField = yField;
      }
    }

    const row = initialData?.position.row ?? Math.floor(widgetCount / 2);
    const col = initialData?.position.col ?? widgetCount % 2;

    onSave({
      title: title || "未命名组件",
      type,
      config,
      position: { col, row, w: width, h: type === "KPI_CARD" ? 1 : 2 },
      datasetId: datasetId || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData?.id ? "编辑组件" : "添加组件"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">组件标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入组件标题"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">图表类型</label>
            <div className="grid grid-cols-5 gap-2">
              {CHART_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setType(ct.value)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    type === ct.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">数据集</label>
            <select
              value={datasetId}
              onChange={(e) => {
                setDatasetId(e.target.value);
                setXField("");
                setYField("");
                setYFields([]);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">选择数据集</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field Configuration */}
          {datasetId && type !== "KPI_CARD" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {type === "PIE_CHART" ? "分类字段" : "X 轴字段"}
                </label>
                <select
                  value={xField}
                  onChange={(e) => setXField(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">选择字段</option>
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {type === "PIE_CHART" ? "数值字段" : "Y 轴字段"}
                </label>
                <select
                  value={yField}
                  onChange={(e) => setYField(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">选择字段</option>
                  {numberColumns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Multi-Y for bar/line/area */}
          {datasetId && ["BAR_CHART", "LINE_CHART", "AREA_CHART"].includes(type) && numberColumns.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                多 Y 轴字段（可选）
              </label>
              <div className="flex flex-wrap gap-2">
                {numberColumns.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleYFieldToggle(c.name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      yFields.includes(c.name)
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KPI aggregation */}
          {datasetId && type === "KPI_CARD" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">数值字段</label>
                <select
                  value={yField}
                  onChange={(e) => setYField(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">选择字段</option>
                  {numberColumns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">聚合方式</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[
                    { value: "sum", label: "求和" },
                    { value: "avg", label: "平均值" },
                    { value: "count", label: "计数" },
                    { value: "min", label: "最小值" },
                    { value: "max", label: "最大值" },
                  ].map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Width */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">宽度</label>
            <div className="flex gap-2">
              <button
                onClick={() => setWidth(1)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  width === 1
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                半宽
              </button>
              <button
                onClick={() => setWidth(2)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  width === 2
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                全宽
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title && !type}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {initialData?.id ? "保存" : "添加"}
          </button>
        </div>
      </div>
    </div>
  );
}
