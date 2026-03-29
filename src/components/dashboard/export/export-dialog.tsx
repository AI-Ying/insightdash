"use client";

import { useState, useRef } from "react";
import { X, Download, Loader2, FileText } from "lucide-react";
import { exportToPDF, formatFilename, type ExportOptions } from "@/lib/pdf-export";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  dashboardTitle: string;
  targetRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportDialog({ open, onClose, dashboardTitle, targetRef }: ExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ExportOptions>({
    paperSize: "A4",
    orientation: "portrait",
  });

  const handleExport = async () => {
    if (!targetRef.current) {
      setError("无法获取仪表板内容，请确保页面已加载");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const filename = formatFilename(dashboardTitle);
      await exportToPDF(targetRef.current, filename, options);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "导出失败，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">导出 PDF</h2>
              <p className="text-sm text-slate-500">{dashboardTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Paper Size */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">纸张大小</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOptions({ ...options, paperSize: "A4" })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  options.paperSize === "A4"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setOptions({ ...options, paperSize: "Letter" })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  options.paperSize === "Letter"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                Letter
              </button>
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">方向</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOptions({ ...options, orientation: "portrait" })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  options.orientation === "portrait"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-6 rounded border-2 border-current" />
                  <span>纵向</span>
                </div>
              </button>
              <button
                onClick={() => setOptions({ ...options, orientation: "landscape" })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  options.orientation === "landscape"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-8 rounded border-2 border-current" />
                  <span>横向</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在生成 PDF...
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                导出 PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
