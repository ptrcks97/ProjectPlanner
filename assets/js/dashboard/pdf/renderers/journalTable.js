import { addFooter } from '../primitives/footer.js';
import { ensurePdfApi } from '../pdfApi.js';

export function renderJournalTable(pdf, entries) {
  ensurePdfApi(pdf);

  const margin = 20;
  const footerSpace = 14;

  pdf.addPage('a4', 'landscape');

  let pageWidth = pdf.internal.pageSize.getWidth();
  let pageHeight = pdf.internal.pageSize.getHeight();
  let usableHeight = pageHeight - margin - footerSpace;

  const lineHeight = 5;
  const cellPaddingX = 2;
  const baseRowHeight = 12;

  const colMin = {
    date: 30,
    duration: 28,
    ref: 70,
    descriptionMin: 140
  };

  const computeColumns = () => {
    const available = pageWidth - margin * 2;
    const fixed = colMin.date + colMin.ref + colMin.duration;
    const descWidth = Math.max(colMin.descriptionMin, available - fixed);
    const total = fixed + descWidth;
    if (total > available) {
      const forcedDesc = Math.max(80, available - fixed);
      return [
        { key: 'date', label: 'Datum', width: colMin.date },
        { key: 'description', label: 'Beschreibung', width: forcedDesc },
        { key: 'ref', label: 'Referenz', width: colMin.ref },
        { key: 'duration', label: 'Stunden', width: colMin.duration }
      ];
    }
    return [
      { key: 'date', label: 'Datum', width: colMin.date },
      { key: 'description', label: 'Beschreibung', width: descWidth },
      { key: 'ref', label: 'Referenz', width: colMin.ref },
      { key: 'duration', label: 'Stunden', width: colMin.duration }
    ];
  };

  let columns = computeColumns();
  const startY = () => margin + 14;
  let y = startY();

  const setBodyStyle = () => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(33, 37, 41);
  };

  const drawHeader = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Arbeitsjournal', margin, y);
    y += 6;

    pdf.setFillColor(230, 236, 245);
    pdf.rect(margin, y, pageWidth - margin * 2, 10, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(23, 37, 84);

    let x = margin + cellPaddingX;
    for (const col of columns) {
      pdf.text(col.label, x, y + 7);
      x += col.width;
    }

    y += 12;
  };

  const addLandscapePage = () => {
    addFooter(pdf);
    pdf.addPage('a4', 'landscape');
    pageWidth = pdf.internal.pageSize.getWidth();
    pageHeight = pdf.internal.pageSize.getHeight();
    usableHeight = pageHeight - margin - footerSpace;
    columns = computeColumns();
    y = startY();
    drawHeader();
    setBodyStyle();
  };

  drawHeader();
  setBodyStyle();

  (entries || []).forEach(entry => {
    const dateText = entry?.date ? String(entry.date) : '—';
    const descText = entry?.description ? String(entry.description) : '—';
    const refText = entry?.ref ? String(entry.ref) : '—';
    const durText = entry?.duration ? String(entry.duration) : '—';

    const descLines = pdf.splitTextToSize(descText, columns[1].width - cellPaddingX * 2);
    const refLines  = pdf.splitTextToSize(refText,  columns[2].width - cellPaddingX * 2);

    const descHeight = 6 + (descLines.length - 1) * lineHeight;
    const refHeight  = 6 + (refLines.length - 1) * lineHeight;
    const rowHeight = Math.max(baseRowHeight, descHeight, refHeight);

    if (y + rowHeight > usableHeight) addLandscapePage();

    let x = margin + cellPaddingX;
    pdf.text(dateText, x, y + 7); x += columns[0].width;
    pdf.text(descLines, x, y + 7); x += columns[1].width;
    pdf.text(refLines, x, y + 7);  x += columns[2].width;
    pdf.text(durText, x, y + 7);

    y += rowHeight;
  });

  addFooter(pdf);
}
