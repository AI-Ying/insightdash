"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, LayoutDashboard, Trash2, Clock } from "lucide-react";

interface Dashboard {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { widgets: number };
  createdBy: { name: string | null; email: string };
}

export default function DashboardsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Resolve workspace slug to ID, then fetch dashboards
  useEffect(() => {
    async function load() {
      try {
        // Get workspace ID from the workspaces list
        const wsRes = await fetch("/api/workspaces");
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) return;
        setWorkspaceId(ws.id);

        const res = await fetch(`/api/workspaces/${ws.id}/dashboards`);
        const data = await res.json();
        setDashboards(data);
      } catch (err) {
        console.error("Failed to load dashboards:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !workspaceId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/dashboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc || undefined }),
      });
      if (res.ok) {
        const dashboard = await res.json();
        router.push(`/w/${slug}/dashboards/${dashboard.id}`);
      }
    } catch (err) {
      console.error("Failed to create dashboard:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (dashboardId: string) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/dashboards/${dashboardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
      }
    } catch (err) {
      console.error("Failed to delete dashboard:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboards</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Dashboard
        </button>
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create Dashboard</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Dashboard title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewTitle("");
                  setNewDesc("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Cards */}
      {dashboards.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <LayoutDashboard className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">No dashboards yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first dashboard to start visualizing data.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <Link href={`/w/${slug}/dashboards/${dashboard.id}`}>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {dashboard.title}
                </h3>
                {dashboard.description && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>{dashboard._count.widgets} widgets</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(dashboard.id);
                  }}
                  className="rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
