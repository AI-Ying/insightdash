/**
 * PDF Export Utility
 * Converts Tailwind CSS classes to inline styles for PDF generation
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

  // Create iframe for isolation
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
    // Write iframe with Tailwind reset styles
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            background: white;
            color: #1e293b;
            padding: 24px;
          }
        </style>
      </head>
      <body></body>
      </html>
    `);
    iframeDoc.close();

    // Clone and convert styles
    const iframeBody = iframeDoc.body;
    const clone = element.cloneNode(true) as HTMLElement;
    convertTailwindToInline(clone);
    iframeBody.appendChild(clone);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(iframeBody, {
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
 * Convert Tailwind classes to inline styles
 */
function convertTailwindToInline(el: Element): void {
  const className = el.getAttribute('class') || '';
  const styles: string[] = [];
  
  // Display
  if (className.includes('flex')) styles.push('display: flex');
  if (className.includes('grid')) styles.push('display: grid');
  if (className.includes('block')) styles.push('display: block');
  if (className.includes('inline-block')) styles.push('display: inline-block');
  if (className.includes('hidden')) styles.push('display: none');
  
  // Flexbox alignment
  if (className.includes('items-center')) styles.push('align-items: center');
  if (className.includes('items-start')) styles.push('align-items: flex-start');
  if (className.includes('items-end')) styles.push('align-items: flex-end');
  if (className.includes('justify-center')) styles.push('justify-content: center');
  if (className.includes('justify-between')) styles.push('justify-content: space-between');
  if (className.includes('justify-end')) styles.push('justify-content: flex-end');
  
  // Gap
  if (className.includes('gap-1')) styles.push('gap: 4px');
  if (className.includes('gap-2')) styles.push('gap: 8px');
  if (className.includes('gap-3')) styles.push('gap: 12px');
  if (className.includes('gap-4')) styles.push('gap: 16px');
  if (className.includes('gap-6')) styles.push('gap: 24px');
  
  // Padding
  if (className.includes('p-1')) styles.push('padding: 4px');
  if (className.includes('p-2')) styles.push('padding: 8px');
  if (className.includes('p-3')) styles.push('padding: 12px');
  if (className.includes('p-4')) styles.push('padding: 16px');
  if (className.includes('p-6')) styles.push('padding: 24px');
  if (className.includes('p-8')) styles.push('padding: 32px');
  if (className.includes('px-2')) styles.push('padding-left: 8px; padding-right: 8px');
  if (className.includes('px-3')) styles.push('padding-left: 12px; padding-right: 12px');
  if (className.includes('px-4')) styles.push('padding-left: 16px; padding-right: 16px');
  if (className.includes('px-6')) styles.push('padding-left: 24px; padding-right: 24px');
  if (className.includes('py-1')) styles.push('padding-top: 4px; padding-bottom: 4px');
  if (className.includes('py-2')) styles.push('padding-top: 8px; padding-bottom: 8px');
  if (className.includes('py-4')) styles.push('padding-top: 16px; padding-bottom: 16px');
  if (className.includes('py-6')) styles.push('padding-top: 24px; padding-bottom: 24px');
  if (className.includes('pt-2')) styles.push('padding-top: 8px');
  if (className.includes('pt-4')) styles.push('padding-top: 16px');
  if (className.includes('pb-2')) styles.push('padding-bottom: 8px');
  if (className.includes('pb-4')) styles.push('padding-bottom: 16px');
  if (className.includes('pr-2')) styles.push('padding-right: 8px');
  if (className.includes('pl-2')) styles.push('padding-left: 8px');
  
  // Margin
  if (className.includes('m-1')) styles.push('margin: 4px');
  if (className.includes('m-2')) styles.push('margin: 8px');
  if (className.includes('m-4')) styles.push('margin: 16px');
  if (className.includes('mx-auto')) styles.push('margin-left: auto; margin-right: auto');
  if (className.includes('mt-1')) styles.push('margin-top: 4px');
  if (className.includes('mt-2')) styles.push('margin-top: 8px');
  if (className.includes('mt-4')) styles.push('margin-top: 16px');
  if (className.includes('mt-6')) styles.push('margin-top: 24px');
  if (className.includes('mb-1')) styles.push('margin-bottom: 4px');
  if (className.includes('mb-2')) styles.push('margin-bottom: 8px');
  if (className.includes('mb-4')) styles.push('margin-bottom: 16px');
  if (className.includes('mb-6')) styles.push('margin-bottom: 24px');
  if (className.includes('ml-1')) styles.push('margin-left: 4px');
  if (className.includes('ml-2')) styles.push('margin-left: 8px');
  if (className.includes('ml-4')) styles.push('margin-left: 16px');
  if (className.includes('mr-1')) styles.push('margin-right: 4px');
  if (className.includes('mr-2')) styles.push('margin-right: 8px');
  if (className.includes('mr-4')) styles.push('margin-right: 16px');
  
  // Width
  if (className.includes('w-full')) styles.push('width: 100%');
  if (className.includes('w-auto')) styles.push('width: auto');
  if (className.includes('w-1/2')) styles.push('width: 50%');
  if (className.includes('w-1/3')) styles.push('width: 33.333%');
  if (className.includes('w-2/3')) styles.push('width: 66.666%');
  if (className.includes('w-1/4')) styles.push('width: 25%');
  if (className.includes('w-3/4')) styles.push('width: 75%');
  if (className.includes('min-w-0')) styles.push('min-width: 0');
  if (className.includes('max-w-')) {
    if (className.includes('max-w-xs')) styles.push('max-width: 20rem');
    if (className.includes('max-w-sm')) styles.push('max-width: 24rem');
    if (className.includes('max-w-md')) styles.push('max-width: 28rem');
    if (className.includes('max-w-lg')) styles.push('max-width: 32rem');
    if (className.includes('max-w-xl')) styles.push('max-width: 36rem');
    if (className.includes('max-w-2xl')) styles.push('max-width: 42rem');
  }
  
  // Height
  if (className.includes('h-full')) styles.push('height: 100%');
  if (className.includes('h-screen')) styles.push('height: 100vh');
  
  // Grid columns
  if (className.includes('grid-cols-1')) styles.push('grid-template-columns: repeat(1, 1fr)');
  if (className.includes('grid-cols-2')) styles.push('grid-template-columns: repeat(2, 1fr)');
  if (className.includes('grid-cols-3')) styles.push('grid-template-columns: repeat(3, 1fr)');
  if (className.includes('grid-cols-4')) styles.push('grid-template-columns: repeat(4, 1fr)');
  
  // Border
  if (className.includes('border')) {
    if (className.includes('border-0')) styles.push('border-width: 0');
    else if (className.includes('border-2')) styles.push('border-width: 2px');
    else if (className.includes('border-4')) styles.push('border-width: 4px');
    else styles.push('border-width: 1px');
    
    if (className.includes('border-slate-')) {
      const colors: Record<string, string> = {
        'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0',
        'slate-300': '#cbd5e1', 'slate-400': '#94a3b8', 'slate-500': '#64748b',
        'slate-600': '#475569', 'slate-700': '#334155', 'slate-800': '#1e293b', 'slate-900': '#0f172a',
      };
      const match = className.match(/border-slate-(\d+)/);
      if (match && colors[`slate-${match[1]}`]) {
        styles.push(`border-color: ${colors[`slate-${match[1]}`]}`);
      } else {
        styles.push('border-color: #e2e8f0');
      }
    } else if (className.includes('border-white')) {
      styles.push('border-color: white');
    } else if (className.includes('border-black')) {
      styles.push('border-color: black');
    } else {
      styles.push('border-color: #e2e8f0');
    }
    
    if (className.includes('border-t')) styles.push('border-top-style: solid');
    if (className.includes('border-b')) styles.push('border-bottom-style: solid');
    if (className.includes('border-l')) styles.push('border-left-style: solid');
    if (className.includes('border-r')) styles.push('border-right-style: solid');
  }
  
  // Border radius
  if (className.includes('rounded')) {
    if (className.includes('rounded-none')) styles.push('border-radius: 0');
    else if (className.includes('rounded-sm')) styles.push('border-radius: 2px');
    else if (className.includes('rounded-lg')) styles.push('border-radius: 8px');
    else if (className.includes('rounded-xl')) styles.push('border-radius: 12px');
    else if (className.includes('rounded-full')) styles.push('border-radius: 9999px');
    else styles.push('border-radius: 4px');
  }
  
  // Background colors
  if (className.includes('bg-white')) styles.push('background-color: white');
  if (className.includes('bg-slate-50')) styles.push('background-color: #f8fafc');
  if (className.includes('bg-slate-100')) styles.push('background-color: #f1f5f9');
  if (className.includes('bg-slate-200')) styles.push('background-color: #e2e8f0');
  if (className.includes('bg-slate-800')) styles.push('background-color: #1e293b');
  if (className.includes('bg-slate-900')) styles.push('background-color: #0f172a');
  if (className.includes('bg-blue-50')) styles.push('background-color: #eff6ff');
  if (className.includes('bg-blue-100')) styles.push('background-color: #dbeafe');
  if (className.includes('bg-blue-500')) styles.push('background-color: #3b82f6');
  if (className.includes('bg-blue-600')) styles.push('background-color: #2563eb');
  if (className.includes('bg-blue-700')) styles.push('background-color: #1d4ed8');
  if (className.includes('bg-red-50')) styles.push('background-color: #fef2f2');
  if (className.includes('bg-red-100')) styles.push('background-color: #fee2e2');
  if (className.includes('bg-red-500')) styles.push('background-color: #ef4444');
  if (className.includes('bg-red-600')) styles.push('background-color: #dc2626');
  if (className.includes('bg-green-50')) styles.push('background-color: #f0fdf4');
  if (className.includes('bg-green-100')) styles.push('background-color: #dcfce7');
  if (className.includes('bg-green-500')) styles.push('background-color: #22c55e');
  if (className.includes('bg-green-600')) styles.push('background-color: #16a34a');
  if (className.includes('bg-yellow-50')) styles.push('background-color: #fefce8');
  if (className.includes('bg-yellow-100')) styles.push('background-color: #fef9c3');
  if (className.includes('bg-yellow-500')) styles.push('background-color: #eab308');
  if (className.includes('bg-emerald-500')) styles.push('background-color: #10b981');
  if (className.includes('bg-indigo-500')) styles.push('background-color: #6366f1');
  
  // Text colors
  if (className.includes('text-white')) styles.push('color: white');
  if (className.includes('text-slate-50')) styles.push('color: #f8fafc');
  if (className.includes('text-slate-100')) styles.push('color: #f1f5f9');
  if (className.includes('text-slate-200')) styles.push('color: #cbd5e1');
  if (className.includes('text-slate-300')) styles.push('color: #94a3b8');
  if (className.includes('text-slate-400')) styles.push('color: #64748b');
  if (className.includes('text-slate-500')) styles.push('color: #64748b');
  if (className.includes('text-slate-600')) styles.push('color: #475569');
  if (className.includes('text-slate-700')) styles.push('color: #334155');
  if (className.includes('text-slate-800')) styles.push('color: #1e293b');
  if (className.includes('text-slate-900')) styles.push('color: #0f172a');
  if (className.includes('text-black')) styles.push('color: black');
  if (className.includes('text-blue-600')) styles.push('color: #2563eb');
  if (className.includes('text-blue-700')) styles.push('color: #1d4ed8');
  if (className.includes('text-red-500')) styles.push('color: #ef4444');
  if (className.includes('text-red-600')) styles.push('color: #dc2626');
  if (className.includes('text-red-700')) styles.push('color: #b91c1c');
  if (className.includes('text-green-500')) styles.push('color: #22c55e');
  if (className.includes('text-green-600')) styles.push('color: #16a34a');
  if (className.includes('text-green-700')) styles.push('color: #15803d');
  if (className.includes('text-yellow-500')) styles.push('color: #eab308');
  if (className.includes('text-yellow-600')) styles.push('color: #ca8a04');
  if (className.includes('text-emerald-500')) styles.push('color: #10b981');
  
  // Font sizes
  if (className.includes('text-xs')) styles.push('font-size: 12px');
  if (className.includes('text-sm')) styles.push('font-size: 14px');
  if (className.includes('text-base')) styles.push('font-size: 16px');
  if (className.includes('text-lg')) styles.push('font-size: 18px');
  if (className.includes('text-xl')) styles.push('font-size: 20px');
  if (className.includes('text-2xl')) styles.push('font-size: 24px');
  if (className.includes('text-3xl')) styles.push('font-size: 30px');
  if (className.includes('text-4xl')) styles.push('font-size: 36px');
  
  // Font weight
  if (className.includes('font-bold')) styles.push('font-weight: bold');
  if (className.includes('font-semibold')) styles.push('font-weight: 600');
  if (className.includes('font-medium')) styles.push('font-weight: 500');
  if (className.includes('font-normal')) styles.push('font-weight: normal');
  
  // Text alignment
  if (className.includes('text-left')) styles.push('text-align: left');
  if (className.includes('text-center')) styles.push('text-align: center');
  if (className.includes('text-right')) styles.push('text-align: right');
  
  // Line height
  if (className.includes('leading-none')) styles.push('line-height: 1');
  if (className.includes('leading-tight')) styles.push('line-height: 1.25');
  if (className.includes('leading-snug')) styles.push('line-height: 1.375');
  if (className.includes('leading-normal')) styles.push('line-height: 1.5');
  if (className.includes('leading-relaxed')) styles.push('line-height: 1.625');
  
  // Shadows
  if (className.includes('shadow')) {
    if (className.includes('shadow-sm')) styles.push('box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    else if (className.includes('shadow-md')) styles.push('box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
    else if (className.includes('shadow-lg')) styles.push('box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
    else if (className.includes('shadow-xl')) styles.push('box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');
    else styles.push('box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)');
  }
  
  // Overflow
  if (className.includes('overflow-hidden')) styles.push('overflow: hidden');
  if (className.includes('overflow-auto')) styles.push('overflow: auto');
  if (className.includes('overflow-x-auto')) styles.push('overflow-x: auto');
  
  // Position
  if (className.includes('relative')) styles.push('position: relative');
  if (className.includes('absolute')) styles.push('position: absolute');
  if (className.includes('fixed')) styles.push('position: fixed');
  if (className.includes('sticky')) styles.push('position: sticky');
  
  // Z-index
  if (className.includes('z-10')) styles.push('z-index: 10');
  if (className.includes('z-20')) styles.push('z-index: 20');
  if (className.includes('z-30')) styles.push('z-index: 30');
  if (className.includes('z-40')) styles.push('z-index: 40');
  if (className.includes('z-50')) styles.push('z-index: 50');
  
  // Cursor
  if (className.includes('cursor-pointer')) styles.push('cursor: pointer');
  if (className.includes('cursor-not-allowed')) styles.push('cursor: not-allowed');
  
  // Opacity
  if (className.includes('opacity-')) {
    const match = className.match(/opacity-(\d+)/);
    if (match) {
      const val = parseInt(match[1]);
      styles.push(`opacity: ${val / 100}`);
    }
  }
  
  // Transition
  if (className.includes('transition')) {
    styles.push('transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter');
    styles.push('transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)');
    styles.push('transition-duration: 150ms');
  }
  
  // Hover states (apply always for PDF)
  // (Skip hover states for simplicity in PDF)
  
  // Apply styles
  if (styles.length > 0) {
    el.setAttribute('style', styles.join('; '));
  }
  
  // Remove class attribute
  el.removeAttribute('class');
  
  // Recursively process children
  for (const child of el.children) {
    convertTailwindToInline(child);
  }
}

export function formatFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
  return `${sanitized}_${date}`;
}
