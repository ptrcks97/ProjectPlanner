import { ensurePdfApi } from '../pdfApi.js';

const DEFAULT_BG = [244, 247, 255]; // wie das Titelblatt

export function attachPageBackground(pdf, rgb = DEFAULT_BG) {
  ensurePdfApi(pdf);

  const paint = () => {
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.rect(0, 0, w, h, 'F');
  };

  // initial page
  paint();

  // wrap addPage to auto-paint new pages
  const origAddPage = pdf.addPage;
  if (typeof origAddPage === 'function') {
    pdf.addPage = function (...args) {
      const res = origAddPage.apply(this, args);
      paint();
      return res;
    };
  }

  return pdf;
}
