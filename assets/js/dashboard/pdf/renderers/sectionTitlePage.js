import { addFooter } from '../primitives/footer.js';
import { ensurePdfApi } from '../pdfApi.js';

export function sectionTitlePage(pdf, titleText, { startNewPage = true } = {}) {
  ensurePdfApi(pdf);
  if (startNewPage) pdf.addPage('a4', 'portrait');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(28, 37, 64);
  pdf.text(titleText, pageWidth / 2, pageHeight / 2, { align: 'center', baseline: 'middle' });
  addFooter(pdf);
}
