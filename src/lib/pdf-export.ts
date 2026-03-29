/**
 * PDF Export Utility
 * Uses html2canvas + jspdf to generate PDF from dashboard
 * Handles Tailwind CSS v4 oklch colors by forcing rgb fallbacks
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface ExportOptions {
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
}

/**
 * Replace oklch colors with rgb fallbacks
 */
function replaceOklchWithRgb(element: HTMLElement): void {
  const rgbFallback = 'rgb(0 0 0)';
  
  // Handle inline styles with oklch
  const allElements = element.querySelectorAll('*');
  allElements.forEach((el) => {
    const style = el.getAttribute('style');
    if (style && style.includes('oklch')) {
      // Replace oklch(...) with rgb(0 0 0)
      const fixed = style.replace(/oklch\([^)]*\)/g, rgbFallback);
      el.setAttribute('style', fixed);
    }
  });
  
  // Handle the element itself
  const selfStyle = element.getAttribute('style');
  if (selfStyle && selfStyle.includes('oklch')) {
    const fixed = selfStyle.replace(/oklch\([^)]*\)/g, rgbFallback);
    element.setAttribute('style', fixed);
  }
}

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

  // Clone the element for modification
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Replace oklch colors with rgb fallbacks
  replaceOklchWithRgb(clone);
  
  // Also handle all children deeply
  clone.querySelectorAll('*').forEach((child) => {
    const style = child.getAttribute('style') || '';
    if (style.includes('oklch')) {
      const fixed = style.replace(/oklch\([^)]*\)/g, 'rgb(128 128 128)');
      child.setAttribute('style', fixed);
    }
  });

  // Create a container for the clone
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${element.scrollWidth}px;
    min-height: ${element.scrollHeight}px;
    background: white;
    padding: 20px;
    box-sizing: border-box;
  `;
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    // Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // Remove any CSS that might have oklch
      onclone: (clonedDoc, clonedBody) => {
        // Remove all stylesheets that might contain oklch
        const sheets = clonedDoc.styleSheets;
        try {
          for (let i = sheets.length - 1; i >= 0; i--) {
            const sheet = sheets[i];
            if (sheet.href && sheet.href.includes('tailwind')) {
              // Remove Tailwind stylesheet
              sheet.disabled = true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets can't be accessed, ignore
        }
        
        // Force white background on body
        clonedBody.style.backgroundColor = 'white';
      },
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
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Format filename with date
 */
export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
