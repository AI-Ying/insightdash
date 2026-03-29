/**
 * PDF Export Utility
 * Handles Tailwind CSS v4 oklch issue by completely disabling stylesheets
 */

import html2canvas from "html2canvas";
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

  // Create a clean white container
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${element.scrollWidth}px;
    min-height: ${element.scrollHeight}px;
    background: white;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Clone with NO classes (strip all class attributes)
  const clone = element.cloneNode(true) as HTMLElement;
  removeAllClasses(clone);
  
  // Force inline styles for all elements (white bg, black text)
  forceInlineStyles(clone);
  
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // Intercept the clone and strip ALL CSS
      onclone: (clonedDoc, clonedBody) => {
        // Remove ALL stylesheets - this is the key fix
        const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        allStyles.forEach(el => el.remove());
        
        // Remove any element with classes (shouldn't exist but just in case)
        const withClasses = clonedBody.querySelectorAll('[class]');
        withClasses.forEach(el => el.removeAttribute('class'));
        
        // Force white bg, black text on body
        clonedBody.style.backgroundColor = 'white';
        clonedBody.style.color = 'black';
        
        // Add override style to force everything to white/black
        const overrideStyle = clonedDoc.createElement('style');
        overrideStyle.textContent = `
          * { 
            background-color: white !important; 
            background: white !important; 
            color: black !important; 
            border-color: #ddd !important; 
          }
        `;
        clonedBody.appendChild(overrideStyle);
      },
    });

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
    document.body.removeChild(container);
  }
}

function removeAllClasses(el: Element): void {
  el.removeAttribute('class');
  el.querySelectorAll('*').forEach(child => child.removeAttribute('class'));
}

function forceInlineStyles(el: Element): void {
  // Set white background and black text
  el.style.backgroundColor = 'white';
  el.style.color = 'black';
  
  // Recursively apply to all children
  el.querySelectorAll('*').forEach(child => {
    const htmlEl = child as HTMLElement;
    htmlEl.style.backgroundColor = 'white';
    htmlEl.style.color = 'black';
    // Preserve some layout styles
    if (htmlEl.style.display === 'flex') {
      htmlEl.style.display = 'flex';
    }
    if (htmlEl.style.width) {
      htmlEl.style.width = htmlEl.style.width;
    }
  });
}

export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
