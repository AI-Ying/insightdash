/**
 * PDF Export Utility
 * Uses iframe isolation to avoid oklch CSS parsing errors
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
  if (!element || element.clientWidth === 0 || element.clientHeight === 0) {
    throw new Error("仪表板内容为空或未加载完成，请稍后重试");
  }

  // Create an isolated iframe - this prevents oklch parsing errors
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${element.scrollWidth}px;
    height: ${element.scrollHeight}px;
    border: none;
  `;
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("无法创建PDF内容");
  }

  try {
    // Write content with basic styles only (NO Tailwind, NO oklch)
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            background: white;
            color: #000;
            padding: 20px;
          }
          .box {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 8px 0;
          }
          .kpi {
            display: inline-block;
            padding: 12px 16px;
            margin: 4px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
        </style>
      </head>
      <body></body>
      </html>
    `);
    iframeDoc.close();

    // Clone the element's inner HTML into the iframe body
    const iframeBody = iframeDoc.body;
    const cloned = element.cloneNode(true) as HTMLElement;
    
    // Strip ALL class attributes and data-* attributes
    stripAllAttributes(cloned);
    
    iframeBody.appendChild(cloned);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture with html2canvas - iframe has NO external stylesheets
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(iframeBody, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // No onclone needed - iframe has no external styles
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: "mm",
      format: options.paperSize === "A4" ? "a4" : "letter",
    });

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

  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Strip all class, style, and data attributes from element and children
 */
function stripAllAttributes(el: Element): void {
  // Remove all attributes except tag name
  while (el.attributes.length > 0) {
    el.removeAttribute(el.attributes[0].name);
  }
  
  // Add basic inline styles to ensure visibility
  el.setAttribute('style', 'background: white; color: black; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 14px;');
  
  // Recursively strip children
  for (const child of el.children) {
    stripAllAttributes(child);
  }
}

export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
