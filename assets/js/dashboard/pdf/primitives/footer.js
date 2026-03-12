import { FOOTER_TEXT } from '../constants.js';
import { ensurePdfApi } from '../pdfApi.js';

export function addFooter(pdf) {
  ensurePdfApi(pdf);
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(90, 99, 116);
  pdf.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 8, { align: 'center' });
}
