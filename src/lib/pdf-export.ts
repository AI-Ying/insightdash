/**
 * PDF Export Utility
 * iframe isolation + forced rgb color override
 */

import { jsPDF } from "jspdf";

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

    // Create isolated iframe with no external styles
    const iframe = document.createElement('iframe');
    const iframeStyle = iframe.style;
    iframeStyle.cssText = `position:absolute;left:-9999px;top:0;width:${element.scrollWidth}px;height:${element.scrollHeight}px;border:none;`;
    document.body.appendChild(iframe);

    const idoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!idoc) {
      document.body.removeChild(iframe);
      throw new Error("无法创建PDF内容");
    }
    const ibody = idoc.body;
    if (!ibody) {
      document.body.removeChild(iframe);
      throw new Error("无法创建PDF内容");
    }

    // Write base HTML with COMPLETE rgb color override
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0;
      color: #1e293b !important;
      background-color: white !important;
      background: white !important;
      border-color: #e2e8f0 !important;
      fill: #1e293b !important;
      stroke: #1e293b !important;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px; 
      line-height: 1.5; 
      background: white; 
      padding: 24px;
    }
    .dashboard {
      background: white;
      padding: 24px;
      border-radius: 12px;
    }
    .kpi-card {
      display: inline-block;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 8px;
      min-width: 120px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: bold;
      color: #1e293b;
    }
    .kpi-label {
      font-size: 12px;
      color: #64748b;
    }
    .chart-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 14px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 20px; }
    .text-2xl { font-size: 24px; }
    .text-3xl { font-size: 30px; }
    .font-bold { font-weight: bold; }
    .font-medium { font-weight: 500; }
    .text-center { text-align: center; }
    .flex { display: flex; }
    .grid { display: grid; }
    .inline-block { display: inline-block; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: 16px; }
    .p-2 { padding: 8px; }
    .p-4 { padding: 16px; }
    .p-6 { padding: 24px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .px-4 { padding-left: 16px; padding-right: 16px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-4 { padding-top: 16px; padding-bottom: 16px; }
    .m-2 { margin: 8px; }
    .m-4 { margin: 16px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .rounded-lg { border-radius: 8px; }
    .rounded-xl { border-radius: 12px; }
    .shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .shadow-lg { box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
    .w-full { width: 100%; }
    .border { border: 1px solid #e2e8f0; }
    .border-2 { border-width: 2px; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
  </style>
  </head><body><div class="dashboard"></div></body></html>`);
    idoc.close();

    // Get the dashboard container - create if not exists
    let dashContainer = ibody.querySelector('.dashboard');
    if (!dashContainer) {
      dashContainer = idoc.createElement('div');
      dashContainer.className = 'dashboard';
      ibody.appendChild(dashContainer);
    }
    
    // Clone and clean the original content
    const content = element.cloneNode(true) as HTMLElement;
    cleanElement(content);
    dashContainer.appendChild(content);

    await new Promise(r => setTimeout(r, 200));

    let canvas;
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      canvas = await html2canvas(ibody, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (cdoc, cbody) => {
          // Final cleanup - remove any remaining stylesheets
          cdoc.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
          // Ensure all colors are rgb
          cbody.querySelectorAll('*').forEach(el => {
            const htmlEl = el as HTMLElement;
            const s = htmlEl.getAttribute('style') || '';
            if (s.includes('oklch')) {
              htmlEl.setAttribute('style', s.replace(/oklch\([^)]*\)/g, 'rgb(128,128,128)'));
            } else {
              // Ensure visible
              if (!s.includes('background') && !s.includes('color')) {
                htmlEl.style.backgroundColor = 'white';
                htmlEl.style.color = '#1e293b';
              }
            }
          });
          cbody.style.backgroundColor = 'white';
        },
      });
    } catch (canvasError) {
      document.body.removeChild(iframe);
      throw new Error("Failed to render content to canvas: " + (canvasError instanceof Error ? canvasError.message : String(canvasError)));
    }

    let pdf;
    try {
      pdf = new jsPDF({
        orientation: options.orientation,
        unit: "mm",
        format: options.paperSize === "A4" ? "a4" : "letter",
      });
    } catch (pdfError) {
      document.body.removeChild(iframe);
      throw new Error("Failed to create PDF document: " + (pdfError instanceof Error ? pdfError.message : String(pdfError)));
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL("image/png");

    let heightLeft = imgHeight;
    let yPosition = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, "PNG", 0, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      yPosition -= pageHeight;
      if (heightLeft > 0) pdf.addPage();
    }

    pdf.save(`${filename}.pdf`);

    document.body.removeChild(iframe);
  } catch (error) {
    // Re-throw SSR-specific errors as-is
    if (error instanceof Error && error.message.includes("browser environment")) {
      throw error;
    }
    // Wrap other errors with context
    throw new Error("PDF export failed: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Remove classes and fix oklch in element
 */
function cleanElement(el: Element): void {
  // Remove class attribute
  el.removeAttribute('class');
  
  // Clean inline styles
  const style = el.getAttribute('style');
  if (style) {
    let fixed = style;
    // Replace oklch
    if (fixed.includes('oklch')) {
      fixed = fixed.replace(/oklch\([^)]*\)/g, 'rgb(128,128,128)');
    }
    el.setAttribute('style', fixed);
  }
  
  // Recurse
  el.querySelectorAll('*').forEach(cleanElement);
}

export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
