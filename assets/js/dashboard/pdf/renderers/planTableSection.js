import { addFooter } from '../primitives/footer.js';
import { ensurePdfApi } from '../pdfApi.js';

export function renderPlanTableSection(
  pdf,
  { title, subtitle, rows, startY = 36, emptyText = 'Keine Daten.' }
) {
  ensurePdfApi(pdf);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const innerWidth = pageWidth - margin * 2;

  const columns = [
    { key: 'phase', label: 'Phase', weight: 0.22 },
    { key: 'name', label: 'Arbeitspaket', weight: 0.30 },
    { key: 'status', label: 'Status', weight: 0.14 },
    { key: 'hours', label: 'Stunden', weight: 0.11 },
    { key: 'start', label: 'Start', weight: 0.11 },
    { key: 'end', label: 'Ende', weight: 0.12 },
  ];

  const totalWeight = columns.reduce((s, c) => s + c.weight, 0);
  columns.forEach(c => { c.width = (c.weight / totalWeight) * innerWidth; });

  const paddingX = 6;
  const paddingY = 6;
  const headerHeight = 24;
  const minRowHeight = 24;
  const lineHeight = 13;

  let y = startY;
  const maxY = () => pageHeight - margin;

  const drawSectionHeader = (continuation = false) => {
    pdf.setTextColor(23, 37, 84);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(continuation ? `${title} (Fortsetzung)` : title, margin, y);
    y += 16;

    if (subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(90, 99, 116);
      pdf.text(subtitle, margin, y);
      y += 12;
    }

    pdf.setTextColor(23, 37, 84);
  };

  const drawHeaderRow = () => {
    pdf.setFillColor(230, 236, 245);
    pdf.rect(margin, y, innerWidth, headerHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);

    let x = margin;
    columns.forEach(col => {
      pdf.text(col.label, x + paddingX, y + 15);
      x += col.width;
    });

    y += headerHeight;
  };

  const addPage = (continuation = false) => {
    addFooter(pdf);
    pdf.addPage('a4', 'landscape');
    y = margin;
    drawSectionHeader(continuation);
    drawHeaderRow();
  };

  const ensureSpace = (needed, continuationTitle = false) => {
    if (y + needed > maxY()) addPage(continuationTitle);
  };

  if (y + headerHeight + 20 > maxY()) {
    addPage(false);
  } else {
    drawSectionHeader(false);
    drawHeaderRow();
  }

  if (!rows.length) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(emptyText, margin, y + 14);
    addFooter(pdf);
    return y + 24;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  rows.forEach((row, idx) => {
    const cellLines = columns.map(col => {
      const raw = row[col.key] || '';
      return pdf.splitTextToSize(String(raw), col.width - paddingX * 2);
    });

    const maxLines = Math.max(...cellLines.map(lines => lines.length || 1));
    const rowHeight = Math.max(minRowHeight, maxLines * lineHeight + paddingY * 2);

    ensureSpace(rowHeight + 6, true);

    if (idx % 2 === 1) {
      pdf.setFillColor(247, 249, 252);
      pdf.rect(margin, y, innerWidth, rowHeight, 'F');
    }

    let x = margin;
    cellLines.forEach((lines, colIdx) => {
      pdf.setTextColor(33, 37, 41);
      pdf.text(lines, x + paddingX, y + paddingY + 10, { maxWidth: columns[colIdx].width - paddingX * 2 });
      x += columns[colIdx].width;
    });

    y += rowHeight;
  });

  addFooter(pdf);
  return y + 14;
}
