"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import { WidgetConfigPanel } from "@/components/dashboard/widget-config-panel";
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
      setEditingWidget(widget);
      setPanelOpen(true);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm("Delete this widget?")) return;
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
      console.error("Failed to delete widget:", err);
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
      console.error("Failed to save widget:", err);
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
        <button
          onClick={handleAddWidget}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Widget
        </button>
      </div>

      {/* Widget Grid */}
      <WidgetGrid
        widgets={dashboard.widgets}
        onEdit={handleEditWidget}
        onDelete={handleDeleteWidget}
        editable
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
