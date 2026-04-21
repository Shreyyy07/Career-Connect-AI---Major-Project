import React from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { InterviewReportPDF, PDFData } from './pdf/InterviewReportPDF';

export async function generatePdfReport(data: PDFData, returnBase64 = false): Promise<string | void> {
  return new Promise<any>(async (resolve, reject) => {
    try {
      // 1. Create a hidden container off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '794px';
      // Force subpixel font rendering for crisp text
      container.style.webkitFontSmoothing = 'antialiased';
      container.style.fontSmooth = 'always';
      document.body.appendChild(container);

      // 2. Render the React component into it
      const root = createRoot(container);
      root.render(
        <div style={{
          width: '794px',
          backgroundColor: '#ffffff',
          WebkitFontSmoothing: 'antialiased',
          fontSmooth: 'always',
        }}>
          <InterviewReportPDF data={data} />
        </div>
      );

      // Wait longer for React to flush DOM, Tailwind classes, fonts, and logo image to load
      await new Promise((r) => setTimeout(r, 1500));

      // 3. Option configuration for html2pdf — standard high DPI settings (scale 2)
      const opt = {
        margin:      0,                 // 0 margins; rely entirely on React p-8 padding to avoid clipping
        filename:    `CCAI_Report_${data.session_id.substring(0, 8).toUpperCase()}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 }, // JPEG dramatically reduces size (prevents Gmail 25MB block)
        html2canvas: {
          scale: 2,                     // 2x DPI — crisp retina text without bloated file size
          useCORS: true,
          logging: false,
          windowWidth: 794,
          letterRendering: true,        // Enable sub-pixel letter rendering
          backgroundColor: '#ffffff',
        },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['css', 'legacy'], avoid: '.no-break' },
      };

      // 4. Generate PDF using html2pdf
      if (returnBase64) {
        const b64 = await html2pdf().set(opt).from(container.firstChild).output('datauristring');
        root.unmount();
        document.body.removeChild(container);
        resolve(b64);
      } else {
        await html2pdf().set(opt).from(container.firstChild).save();
        root.unmount();
        document.body.removeChild(container);
        resolve();
      }
    } catch (err) {
      console.error('PDF generation failed', err);
      reject(err);
    }
  });
}
