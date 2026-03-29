"use client";

import { useRef, useState } from "react";
import { exportToPDF, formatFilename } from "@/lib/pdf-export";

export default function TestPDFPage() {
  const testRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!testRef.current) {
      setError("参考元素不存在");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      console.log("Testing PDF export...");
      console.log("Element:", testRef.current);
      console.log("Element dimensions:", testRef.current.clientWidth, "x", testRef.current.clientHeight);

      const filename = formatFilename("测试仪表板");
      await exportToPDF(testRef.current, filename);
      setSuccess(true);
    } catch (e) {
      console.error("PDF Export Error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📄 PDF 导出功能测试</h1>

      <div
        ref={testRef}
        style={{
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          margin: "10px 0",
          width: "800px",
        }}
      >
        <h2>测试仪表板</h2>
        <p>这是一个用于测试 PDF 导出的示例内容</p>

        <div
          style={{
            background: "white",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            height: "150px",
          }}
        >
          <h3>📊 示例图表</h3>
          <p>图表内容区域</p>
        </div>

        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <div
            style={{
              background: "white",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              flex: 1,
            }}
          >
            <h4>KPI 1</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>97.2%</p>
          </div>
          <div
            style={{
              background: "white",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              flex: 1,
            }}
          >
            <h4>KPI 2</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>1,234</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "#3b82f6",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          {loading ? "正在导出..." : "📥 导出 PDF"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            background: "#fee",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
          }}
        >
          ❌ 导出失败: {error}
        </div>
      )}

      {success && (
        <div
          style={{
            color: "green",
            background: "#efe",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
          }}
        >
          ✅ PDF 导出成功！
        </div>
      )}
    </div>
  );
}
