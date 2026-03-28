"use client";

import { useState } from "react";
import { X, Globe, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { API_TEMPLATES, TEMPLATE_CATEGORIES, type ApiTemplate } from "@/lib/constants";

interface ApiUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (data: { templateId?: string; name?: string; url: string; method: string; responsePath: string }) => Promise<void>;
}

export function ApiUploadModal({ open, onClose, onUpload }: ApiUploadModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ApiTemplate | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [responsePath, setResponsePath] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleTemplateSelect = (template: ApiTemplate) => {
    setSelectedTemplate(template);
    setCustomUrl(template.url);
    setCustomName(template.name);
    setResponsePath(template.responsePath);
    setTestResult(null);
    setError("");
  };

  const handleTestConnection = async () => {
    const url = isCustom ? customUrl : selectedTemplate?.url;
    if (!url) return;

    setTesting(true);
    setTestResult(null);
    setError("");

    try {
      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method: "GET",
          responsePath: isCustom ? responsePath : selectedTemplate?.responsePath,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✓ 连接成功！获取 ${data.preview?.rowCount || 0} 条数据，${data.preview?.columns?.length || 0} 个字段`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "连接失败",
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : "连接失败",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    const url = isCustom ? customUrl : selectedTemplate?.url;
    if (!url) {
      setError("请选择模板或输入自定义 URL");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await onUpload({
        templateId: isCustom ? undefined : selectedTemplate?.id,
        name: customName || (isCustom ? "自定义 API" : selectedTemplate?.name),
        url,
        method: "GET",
        responsePath: isCustom ? responsePath : (selectedTemplate?.responsePath || ""),
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setCustomUrl("");
    setCustomName("");
    setResponsePath("");
    setTestResult(null);
    setError("");
    setIsCustom(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">添加 API 数据源</h2>
          <button onClick={handleClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Template Selection */}
          {!isCustom && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">选择模板</label>
              <div className="space-y-4">
                {TEMPLATE_CATEGORIES.map((category) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {API_TEMPLATES.filter((t) => t.category === category).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                            selectedTemplate?.id === template.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-900">{template.name}</span>
                          <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">{template.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom URL Form */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700">自定义配置</label>
              <button
                onClick={() => {
                  setIsCustom(!isCustom);
                  if (!isCustom) {
                    setSelectedTemplate(null);
                    setCustomUrl("");
                    setResponsePath("");
                  }
                }}
                className={`flex items-center gap-1 text-sm ${
                  isCustom ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {isCustom ? "使用模板" : "自定义 URL"}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {isCustom && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">数据源名称</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="我的 API 数据源"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API URL</label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.example.com/data"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Response Path <span className="text-slate-400 font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={responsePath}
                    onChange={(e) => setResponsePath(e.target.value)}
                    placeholder="如: results, items, data"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">用于提取嵌套数组，如 "results" 或 "data.items"</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Template Preview */}
          {selectedTemplate && !isCustom && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <h4 className="text-sm font-medium text-slate-900">{selectedTemplate.name}</h4>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{selectedTemplate.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <Globe className="h-3 w-3 text-slate-400" />
                <code className="text-xs text-slate-600 line-clamp-1">{selectedTemplate.url}</code>
              </div>
              {selectedTemplate.responsePath && (
                <p className="mt-1 text-xs text-slate-400">
                  Response Path: <code className="bg-slate-200 px-1 rounded">{selectedTemplate.responsePath}</code>
                </p>
              )}
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-lg p-3 ${
                testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={handleTestConnection}
            disabled={!selectedTemplate?.url && !customUrl || testing}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {testing ? "测试中..." : "测试连接"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={(!selectedTemplate?.url && !customUrl) || uploading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {uploading ? "创建中..." : "创建数据源"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
