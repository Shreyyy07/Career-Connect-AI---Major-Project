import React from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { InterviewReportPDF, PDFData } from './pdf/InterviewReportPDF';

export async function generatePdfReport(data: PDFData) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // 1. Create a hidden container off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // 2. Render the React component into it
      const root = createRoot(container);
      
      // We wrap it in a div that enforces the width so it captures predictably
      root.render(
        <div style={{ width: '800px', backgroundColor: '#ffffff' }}>
          <InterviewReportPDF data={data} />
        </div>
      );

      // Wait a moment for React to flush DOM updates and fonts/images to load
      await new Promise((r) => setTimeout(r, 800));

      // 3. Option configuration for html2pdf
      const opt = {
        margin:       [20, 0, 20, 0], // Top, Right, Bottom, Left margins (in pt or mm)
        filename:     `CCAI_Report_${data.session_id.substring(0, 8)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      // 4. Generate PDF using html2pdf
      await html2pdf().set(opt).from(container.firstChild).save();

      // 5. Cleanup DOM
      root.unmount();
      document.body.removeChild(container);

      resolve();
    } catch (err) {
      console.error("PDF generation failed", err);
      reject(err);
    }
  });
}
