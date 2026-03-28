"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Database, Trash2, FileSpreadsheet } from "lucide-react";
import { CSVUploadModal } from "@/components/datasource/csv-upload-modal";

interface DataSourceItem {
  id: string;
  name: string;
  type: string;
  config: string;
  createdAt: string;
  _count: { datasets: number };
}

export default function DataSourcesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const wsRes = await fetch("/api/workspaces");
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) return;
        setWorkspaceId(ws.id);

        const res = await fetch(`/api/workspaces/${ws.id}/datasources`);
        if (res.ok) setDataSources(await res.json());
      } catch (err) {
        console.error("Failed to load data sources:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleUpload = async (file: File, name: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const res = await fetch(`/api/workspaces/${workspaceId}/datasources`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const created = await res.json();
    setDataSources((prev) => [created, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this data source and all its datasets?")) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/datasources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setDataSources((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
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
        <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Upload CSV
        </button>
      </div>

      <CSVUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      {dataSources.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">No data sources yet</h2>
          <p className="mt-2 text-sm text-slate-500">Upload a CSV file to get started.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Upload CSV
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dataSources.map((ds) => {
            let meta: { originalName?: string; rowCount?: number } = {};
            try { meta = JSON.parse(ds.config); } catch { /* ignore */ }

            return (
              <div
                key={ds.id}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <Link
                  href={`/w/${slug}/datasources/${ds.id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="rounded-lg bg-emerald-50 p-2.5">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ds.name}</h3>
                    <p className="text-xs text-slate-400">
                      {ds.type} &middot; {ds._count.datasets} dataset{ds._count.datasets !== 1 ? "s" : ""}
                      {meta.rowCount ? ` \u00b7 ${meta.rowCount.toLocaleString()} rows` : ""}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(ds.id)}
                  className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
