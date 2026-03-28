"use client";

import { ChartWrapper } from "@/components/charts/chart-wrapper";
import type { WidgetConfig, WidgetPosition, DatasetSchema } from "@/lib/types";
import { Settings, Trash2 } from "lucide-react";

interface WidgetData {
  id: string;
  title: string;
  type: string;
  config: unknown;
  position: unknown;
  dataset?: {
    id: string;
    name: string;
    schema: unknown;
  } | null;
}

interface WidgetGridProps {
  widgets: WidgetData[];
  onEdit?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
  editable?: boolean;
}

const HEIGHT_MAP: Record<number, string> = {
  1: "h-48",
  2: "h-72",
  3: "h-96",
  4: "h-[28rem]",
};

export function WidgetGrid({ widgets, onEdit, onDelete, editable = false }: WidgetGridProps) {
  if (widgets.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
        <p className="text-lg font-semibold text-slate-700">No widgets yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Add a widget to start visualizing your data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {widgets.map((widget) => {
        const config = (typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config || {}) as WidgetConfig;
        const position = (typeof widget.position === "string" ? JSON.parse(widget.position) : widget.position || { col: 0, row: 0, w: 1, h: 2 }) as WidgetPosition;
        const rawSchema = widget.dataset?.schema;
        const datasetSchema = (typeof rawSchema === "string" ? JSON.parse(rawSchema) : rawSchema || null) as DatasetSchema | null;
        const heightClass = HEIGHT_MAP[position.h] || "h-72";
        const colSpan = position.w === 2 ? "md:col-span-2" : "";

        return (
          <div
            key={widget.id}
            className={`rounded-xl border border-slate-200 bg-white p-4 ${heightClass} ${colSpan} flex flex-col`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700 truncate">
                {widget.title}
              </h3>
              {editable && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit?.(widget.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(widget.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <ChartWrapper
                type={widget.type}
                config={config}
                title={widget.title}
                datasetSchema={datasetSchema}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
