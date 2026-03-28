"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Database, Trash2, FileSpreadsheet, Globe } from "lucide-react";
import { CSVUploadModal } from "@/components/datasource/csv-upload-modal";
import { ApiUploadModal } from "@/components/datasource/api-upload-modal";

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
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showApiUpload, setShowApiUpload] = useState(false);

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

  const handleCSVUpload = async (file: File, name: string) => {
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

  const handleApiUpload = async (data: {
    templateId?: string;
    name?: string;
    url: string;
    method: string;
    responsePath: string;
  }) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/datasources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "API",
        ...data,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create API data source");
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApiUpload(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Globe className="h-4 w-4" />
            添加 API
          </button>
          <button
            onClick={() => setShowCSVUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            上传 CSV
          </button>
        </div>
      </div>

      <CSVUploadModal
        open={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onUpload={handleCSVUpload}
      />

      <ApiUploadModal
        open={showApiUpload}
        onClose={() => setShowApiUpload(false)}
        onUpload={handleApiUpload}
      />

      {dataSources.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">No data sources yet</h2>
          <p className="mt-2 text-sm text-slate-500">上传 CSV 文件或添加 API 数据源开始。</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => setShowApiUpload(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Globe className="h-4 w-4" />
              添加 API
            </button>
            <button
              onClick={() => setShowCSVUpload(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              上传 CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dataSources.map((ds) => {
            let meta: { originalName?: string; rowCount?: number; url?: string } = {};
            try { meta = JSON.parse(ds.config); } catch { /* ignore */ }

            const isApi = ds.type === "API";

            return (
              <div
                key={ds.id}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <Link
                  href={`/w/${slug}/datasources/${ds.id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className={`rounded-lg p-2.5 ${isApi ? "bg-blue-50" : "bg-emerald-50"}`}>
                    {isApi ? (
                      <Globe className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ds.name}</h3>
                    <p className="text-xs text-slate-400">
                      {ds.type} &middot; {ds._count.datasets} dataset{ds._count.datasets !== 1 ? "s" : ""}
                      {meta.rowCount ? ` \u00b7 ${meta.rowCount.toLocaleString()} rows` : ""}
                      {isApi && meta.url ? ` \u00b7 API` : ""}
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
