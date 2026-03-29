/**
 * PDF Export Utility
 * Uses html2canvas + jspdf to generate PDF from dashboard
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface ExportOptions {
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}

const PAGE_SIZES = {
  A4: { width: 210, height: 297 }, // mm
  Letter: { width: 215.9, height: 279.4 }, // mm
};

/**
 * Export an HTML element to PDF
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string,
  options: ExportOptions = { paperSize: "A4", orientation: "portrait" }
): Promise<void> {
  // Validate element
  if (!element || element.clientWidth === 0 || element.clientHeight === 0) {
    throw new Error("仪表板内容为空或未加载完成，请稍后重试");
  }

  // Capture HTML element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  // Create PDF
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: options.paperSize === "A4" ? "a4" : "letter",
  });

  // Calculate dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create image
  const imgData = canvas.toDataURL("image/png");

  // Add image (handle overflow to new pages)
  let heightLeft = imgHeight;
  let yPosition = 0;

  while (heightLeft > 0) {
    pdf.addImage(imgData, "PNG", 0, yPosition, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    yPosition -= pageHeight;

    if (heightLeft > 0) {
      pdf.addPage();
    }
  }

  // Download
  pdf.save(`${filename}.pdf`);
}

/**
 * Format filename with date
 */
export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
