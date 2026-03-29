"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileDown } from "lucide-react";
import Link from "next/link";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import { WidgetConfigPanel } from "@/components/dashboard/widget-config-panel";
import { ExportDialog } from "@/components/dashboard/export/export-dialog";
import type { WidgetConfig, WidgetPosition, DatasetSchema } from "@/lib/types";

interface Widget {
  id: string;
  title: string;
  type: string;
  config: WidgetConfig;
  position: WidgetPosition;
  datasetId: string | null;
  dataset?: { id: string; name: string; schema: DatasetSchema | null } | null;
}

interface Dashboard {
  id: string;
  title: string;
  description: string | null;
  widgets: Widget[];
}

interface DatasetOption {
  id: string;
  name: string;
  schema: DatasetSchema | null;
}

export default function DashboardEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        // Resolve workspace slug to ID
        const wsRes = await fetch("/api/workspaces");
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) return;
        setWorkspaceId(ws.id);

        // Load dashboard and datasets in parallel
        const [dashRes, dsRes] = await Promise.all([
          fetch(`/api/workspaces/${ws.id}/dashboards/${dashboardId}`),
          fetch(`/api/workspaces/${ws.id}/datasets`),
        ]);

        if (!dashRes.ok) {
          router.push(`/w/${slug}/dashboards`);
          return;
        }

        const dashData = await dashRes.json();
        setDashboard(dashData);

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          setDatasets(dsData);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug, dashboardId, router]);

  const handleAddWidget = () => {
    setEditingWidget(null);
    setPanelOpen(true);
  };

  const handleEditWidget = (widgetId: string) => {
    const widget = dashboard?.widgets.find((w) => w.id === widgetId);
    if (widget) {
      // Parse stringified JSON from API
      const parsed = {
        ...widget,
        config: typeof widget.config === "string" ? JSON.parse(widget.config) : widget.config,
        position: typeof widget.position === "string" ? JSON.parse(widget.position) : widget.position,
      };
      setEditingWidget(parsed);
      setPanelOpen(true);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm("确定删除此组件吗？")) return;
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${widgetId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDashboard((prev) =>
          prev ? { ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId) } : prev
        );
      }
    } catch (err) {
      console.error("删除组件失败:", err);
    }
  };

  const handleSaveWidget = async (data: {
    title: string;
    type: string;
    config: WidgetConfig;
    position: { col: number; row: number; w: number; h: number };
    datasetId?: string;
  }) => {
    try {
      if (editingWidget) {
        // Update existing
        const res = await fetch(
          `/api/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${editingWidget.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  widgets: prev.widgets.map((w) =>
                    w.id === editingWidget.id ? updated : w
                  ),
                }
              : prev
          );
        }
      } else {
        // Create new
        const res = await fetch(
          `/api/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (res.ok) {
          const created = await res.json();
          setDashboard((prev) =>
            prev ? { ...prev, widgets: [...prev.widgets, created] } : prev
          );
        }
      }
    } catch (err) {
      console.error("保存组件失败:", err);
    }
    setPanelOpen(false);
    setEditingWidget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Dashboard not found</p>
        <Link
          href={`/w/${slug}/dashboards`}
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboards
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/w/${slug}/dashboards`}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{dashboard.title}</h1>
            {dashboard.description && (
              <p className="text-sm text-slate-500">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            导出 PDF
          </button>
          <button
            onClick={handleAddWidget}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加组件
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div ref={dashboardRef} className="bg-white rounded-xl border border-slate-200 p-6">
        <WidgetGrid
          widgets={dashboard.widgets}
          onEdit={handleEditWidget}
          onDelete={handleDeleteWidget}
          editable
        />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        dashboardTitle={dashboard.title}
        targetRef={dashboardRef}
      />

      {/* Widget Config Panel */}
      <WidgetConfigPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
        datasets={datasets}
        initialData={
          editingWidget
            ? {
                id: editingWidget.id,
                title: editingWidget.title,
                type: editingWidget.type,
                config: editingWidget.config,
                position: editingWidget.position,
                datasetId: editingWidget.datasetId,
              }
            : undefined
        }
        widgetCount={dashboard.widgets.length}
      />
    </div>
  );
}
