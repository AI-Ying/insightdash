"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DatasetDetail {
  id: string;
  name: string;
  schema: string | null;
  createdAt: string;
}

interface DataSourceDetail {
  id: string;
  name: string;
  type: string;
  config: string;
  datasets: DatasetDetail[];
}

interface Column {
  name: string;
  type: string;
}

export default function DataSourceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const dsId = params.id as string;

  const [ds, setDs] = useState<DataSourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDataset, setActiveDataset] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const wsRes = await fetch("/api/workspaces");
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) return;

        const res = await fetch(`/api/workspaces/${ws.id}/datasources/${dsId}`);
        if (res.ok) {
          const data = await res.json();
          setDs(data);
          if (data.datasets.length > 0) setActiveDataset(data.datasets[0].id);
        }
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, dsId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!ds) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Data source not found</p>
      </div>
    );
  }

  const dataset = ds.datasets.find((d) => d.id === activeDataset);
  let columns: Column[] = [];
  let rows: Record<string, string | number>[] = [];

  if (dataset?.schema) {
    try {
      const parsed = JSON.parse(dataset.schema);
      columns = parsed.columns || [];
      rows = parsed.rows || [];
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/w/${slug}/datasources`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ds.name}</h1>
          <p className="text-sm text-slate-500">{ds.type} &middot; {rows.length.toLocaleString()} rows &middot; {columns.length} columns</p>
        </div>
      </div>

      {/* Data Table Preview */}
      {columns.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap"
                    >
                      {col.name}
                      <span className="ml-1 text-xs font-normal text-slate-400">({col.type})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.name} className="px-4 py-2 text-slate-600 whitespace-nowrap">
                        {String(row[col.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && (
            <div className="px-4 py-3 text-center text-xs text-slate-400 border-t border-slate-100">
              Showing 50 of {rows.length.toLocaleString()} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}
