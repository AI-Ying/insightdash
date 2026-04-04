/**
 * PDF Export Utility
 * iframe isolation + forced rgb color override
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface ExportOptions {
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}

export async function exportToPDF(
  element: HTMLElement,
  filename: string,
  options: ExportOptions = { paperSize: "A4", orientation: "portrait" }
): Promise<void> {
  // SSR Guard
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF export is only available in browser environment");
  }

  try {
    if (!element || element.scrollWidth === 0 || element.scrollHeight === 0) {
      throw new Error("仪表板内容为空或未加载完成");
    }

    console.log("[PDF Export] Starting export...");
    console.log("[PDF Export] Element dimensions:", element.scrollWidth, "x", element.scrollHeight);

    // Wait for fonts and images to load
    await document.fonts.ready;
    console.log("[PDF Export] Fonts ready");

    // Clone element for canvas rendering
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply styles to ensure visibility
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.backgroundColor = "white";
    clone.style.color = "black";
    document.body.appendChild(clone);

    // Wait for clone to render
    await new Promise(r => setTimeout(r, 100));

    let canvas;
    try {
      console.log("[PDF Export] Rendering canvas...");
      
      canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc, clonedElement) => {
          console.log("[PDF Export] onclone callback");
          // Ensure all elements are visible
          const allElements = clonedElement.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.backgroundColor = htmlEl.style.backgroundColor || "transparent";
          });
        },
      });
      
      console.log("[PDF Export] Canvas rendered:", canvas.width, "x", canvas.height);
    } catch (canvasError) {
      document.body.removeChild(clone);
      console.error("[PDF Export] Canvas error:", canvasError);
      throw new Error("渲染内容失败: " + (canvasError instanceof Error ? canvasError.message : String(canvasError)));
    }

    // Remove clone
    document.body.removeChild(clone);

    let pdf;
    try {
      console.log("[PDF Export] Creating PDF...");
      pdf = new jsPDF({
        orientation: options.orientation,
        unit: "mm",
        format: options.paperSize === "A4" ? "a4" : "letter",
      });
    } catch (pdfError) {
      console.error("[PDF Export] PDF creation error:", pdfError);
      throw new Error("创建 PDF 失败: " + (pdfError instanceof Error ? pdfError.message : String(pdfError)));
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log("[PDF Export] Page size:", pageWidth, "x", pageHeight);
    console.log("[PDF Export] Image size:", imgWidth, "x", imgHeight);

    const imgData = canvas.toDataURL("image/png");
    console.log("[PDF Export] Image data length:", imgData.length);

    let heightLeft = imgHeight;
    let yPosition = 0;
    let pageCount = 0;

    while (heightLeft > 0) {
      if (pageCount > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", 0, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      yPosition -= pageHeight;
      pageCount++;
    }

    console.log("[PDF Export] Pages created:", pageCount);
    
    pdf.save(`${filename}.pdf`);
    console.log("[PDF Export] PDF saved successfully");

  } catch (error) {
    // Re-throw SSR-specific errors as-is
    if (error instanceof Error && error.message.includes("browser environment")) {
      throw error;
    }
    // Wrap other errors with context
    console.error("[PDF Export] Export failed:", error);
    throw new Error("PDF 导出失败: " + (error instanceof Error ? error.message : String(error)));
  }
}

export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
