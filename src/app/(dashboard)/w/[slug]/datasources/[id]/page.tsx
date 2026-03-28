"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, Table2 } from "lucide-react";

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
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const wsRes = await fetch("/api/workspaces");
        const workspaces = await wsRes.json();
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) return;

        const res = await fetch(`/api/workspaces/${ws.id}/datasources/${dsId}`);
        if (res.ok) {
          const data = await res.json();
          setDs(data);
          // Select first dataset by default
          if (data.datasets.length > 0) {
            setActiveDatasetId(data.datasets[0].id);
          }
        } else if (res.status === 404) {
          setDs(null);
        }
      } catch (err) {
        console.error("Failed to load:", err);
        setError("Failed to load data source");
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

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
        <Link
          href={`/w/${slug}/datasources`}
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to data sources
        </Link>
      </div>
    );
  }

  if (!ds) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Data source not found</p>
        <Link
          href={`/w/${slug}/datasources`}
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to data sources
        </Link>
      </div>
    );
  }

  // Find the active dataset and parse its schema
  const activeDataset = ds.datasets.find((d) => d.id === activeDatasetId);
  let columns: Column[] = [];
  let rows: Record<string, string | number>[] = [];
  let parseError = false;

  if (activeDataset?.schema) {
    try {
      const parsed = JSON.parse(activeDataset.schema);
      columns = parsed.columns || [];
      rows = parsed.rows || [];
    } catch {
      parseError = true;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/w/${slug}/datasources`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ds.name}</h1>
          <p className="text-sm text-slate-500">{ds.type} &middot; {ds.datasets.length} dataset{ds.datasets.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Dataset Tabs - Only show if multiple datasets */}
      {ds.datasets.length > 0 && (
        <div className="mb-4 border-b border-slate-200">
          <div className="flex gap-4">
            {ds.datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => setActiveDatasetId(dataset.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeDatasetId === dataset.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Table2 className="h-4 w-4" />
                {dataset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Datasets */}
      {ds.datasets.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">No datasets</h2>
          <p className="mt-2 text-sm text-slate-500">This data source has no datasets.</p>
        </div>
      )}

      {/* Parse Error */}
      {parseError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to parse dataset schema. The data may be corrupted.
        </div>
      )}

      {/* Data Table Preview */}
      {columns.length > 0 && !parseError && (
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
          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No data in this dataset
            </div>
          )}
        </div>
      )}

      {/* Empty Dataset (has dataset but no schema) */}
      {ds.datasets.length > 0 && !activeDataset?.schema && !parseError && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">This dataset has no data.</p>
        </div>
      )}
    </div>
  );
}
