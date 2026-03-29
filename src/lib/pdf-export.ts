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
  // Capture HTML element
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  // Calculate PDF dimensions
  const pageSize = PAGE_SIZES[options.paperSize];
  const isLandscape = options.orientation === "landscape";

  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: options.paperSize.toLowerCase(),
  });

  // Calculate content dimensions
  const imgWidth = isLandscape ? pageSize.height : pageSize.width;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Add image to PDF (may span multiple pages)
  let heightLeft = imgHeight;
  let position = 0;

  // Page dimensions in mm
  const pageWidth = isLandscape ? pageSize.height : pageSize.width;
  const pageHeight = isLandscape ? pageSize.width : pageSize.height;

  // Create image from canvas
  const imgData = canvas.toDataURL("image/png");

  // Add image page by page
  while (heightLeft > 0) {
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    position -= pageHeight;

    if (heightLeft > 0) {
      pdf.addPage();
    }
  }

  // Download PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Format filename with date
 */
export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
