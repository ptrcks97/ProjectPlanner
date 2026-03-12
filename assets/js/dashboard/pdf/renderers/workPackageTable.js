import { STATUS_STYLE } from '../constants.js';
import { ensurePdfApi } from '../pdfApi.js';
import { addFooter } from '../primitives/footer.js';
import { measureStatusBadge, drawStatusBadge } from '../primitives/statusBadge.js';

export function renderWorkPackageTable(pdf, rows, startY = 22) {
  ensurePdfApi(pdf);

  const ORIENTATION = 'landscape';
  const margin = 18;
  const footerSpace = 14;

  const FONT = 'helvetica';
  const fontSizeBody = 10;
  const fontSizeHeader = 10;
  const lineHeight = 5.2;

  const C = {
    text: [33, 37, 41],
    muted: [90, 99, 116],
    headerText: [23, 37, 84],
    headerBg: [243, 246, 252],
    headerBorder: [226, 232, 240],
    rowAlt: [250, 251, 253],
    grid: [231, 236, 244]
  };

  const columns = [
    { key: 'title', label: 'Arbeitspaket',  weight: 0.42, align: 'left',   maxLines: 2, bold: true },
    { key: 'phase', label: 'Phase',        weight: 0.21, align: 'left',   maxLines: 2, muted: true },
    { key: 'status', label: 'Status',      weight: 0.13, align: 'center', maxLines: 1 },
    { key: 'plannedTime', label: 'Stunden', weight: 0.08, align: 'right',  maxLines: 1 },
    { key: 'from', label: 'Start',         weight: 0.08, align: 'center', maxLines: 1 },
    { key: 'to',   label: 'Ende',          weight: 0.08, align: 'center', maxLines: 1 }
  ];

  const setFill = (rgb) => pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb) => pdf.setTextColor(rgb[0], rgb[1], rgb[2]);

  const pageWidth = () => pdf.internal.pageSize.getWidth();
  const pageHeight = () => pdf.internal.pageSize.getHeight();
  const innerW = () => pageWidth() - margin * 2;

  const ensureLandscapePage = () => {
    const w = pageWidth();
    const h = pageHeight();
    if (ORIENTATION === 'landscape' && h > w) {
      pdf.addPage('a4', 'landscape');
    }
  };

  const computeColumnWidths = () => {
    const sum = columns.reduce((s, c) => s + c.weight, 0) || 1;
    const usable = innerW();
    columns.forEach(c => { c.width = (c.weight / sum) * usable; });
  };

  const clampLines = (lines, maxLines) => {
    const arr = Array.isArray(lines) ? lines : [String(lines || '—')];
    if (!maxLines || arr.length <= maxLines) return arr;
    const cut = arr.slice(0, maxLines);
    cut[maxLines - 1] = String(cut[maxLines - 1]).replace(/\s+$/, '') + '…';
    return cut;
  };

  const splitToLines = (text, maxWidth, maxLines) => {
    const raw = pdf.splitTextToSize(String(text ?? '—'), Math.max(1, maxWidth));
    return clampLines(raw, maxLines);
  };

  const drawCellText = (lines, x, yMid, col, padX) => {
    const txt = Array.isArray(lines) ? lines : [String(lines)];
    const blockH = txt.length * lineHeight;
    const y0 = yMid - blockH / 2 + (lineHeight * 0.75);

    if (col.align === 'right') {
      txt.forEach((t, i) => pdf.text(t, x + col.width - padX, y0 + i * lineHeight, { align: 'right' }));
    } else if (col.align === 'center') {
      txt.forEach((t, i) => pdf.text(t, x + col.width / 2, y0 + i * lineHeight, { align: 'center' }));
    } else {
      pdf.text(txt, x + padX, y0);
    }
  };

  ensureLandscapePage();
  computeColumnWidths();

  let y = Math.max(margin, startY);
  const usableBottom = () => pageHeight() - margin - footerSpace;

  const addPage = (continuation = true) => {
    addFooter(pdf);
    pdf.addPage('a4', ORIENTATION);
    computeColumnWidths();
    y = margin;
    drawHeaderRow(continuation);
  };

  const ensureSpace = (needed) => {
    if (y + needed > usableBottom()) addPage(true);
  };

  const headerH = 14;
  const headerPadX = 5;
  const rowPadX = 5;
  const rowPadY = 3.2;

  const drawHeaderRow = (continuation = false) => {
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(12);
    setText(C.headerText);
    pdf.text(continuation ? 'Arbeitsplan (Fortsetzung)' : 'Arbeitsplan', margin, y - 2);

    setFill(C.headerBg);
    setDraw(C.headerBorder);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, innerW(), headerH, 3, 3, 'FD');

    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(fontSizeHeader);
    setText(C.headerText);

    let x = margin;
    columns.forEach(col => {
      const lbl = splitToLines(col.label, col.width - headerPadX * 2, 1);
      drawCellText(lbl, x, y + headerH / 2, col, headerPadX);
      x += col.width;
    });

    y += headerH + 4;
  };

  drawHeaderRow(false);

  pdf.setFont(FONT, 'normal');
  pdf.setFontSize(fontSizeBody);

  rows.forEach((row, idx) => {
    const titleCol = columns[0];
    const phaseCol = columns[1];

    const titleLines = splitToLines(row.title || '—', titleCol.width - rowPadX * 2, titleCol.maxLines);
    const phaseLines = splitToLines(row.phase || '—', phaseCol.width - rowPadX * 2, phaseCol.maxLines);

    const maxTextLines = Math.max(titleLines.length, phaseLines.length, 1);
    const rowH = Math.max(13, maxTextLines * lineHeight + rowPadY * 2);

    ensureSpace(rowH + 2);

    if (idx % 2 === 1) {
      setFill(C.rowAlt);
      pdf.rect(margin, y, innerW(), rowH, 'F');
    }
    setDraw(C.grid);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + rowH, margin + innerW(), y + rowH);

    const yMid = y + rowH / 2;
    let x = margin;

    pdf.setFont(FONT, 'bold');
    setText(C.text);
    drawCellText(titleLines, x, yMid, titleCol, rowPadX);
    x += titleCol.width;

    pdf.setFont(FONT, 'normal');
    setText(C.muted);
    drawCellText(phaseLines, x, yMid, phaseCol, rowPadX);
    x += phaseCol.width;

    const statusCol = columns[2];
    const styleKey = (row.statusRaw || '').toLowerCase().replace(/\s+/g, '');
    const style = STATUS_STYLE[styleKey] || STATUS_STYLE.backlog;
    const badge = measureStatusBadge(pdf, row.status || '—', style);
    const badgeX = x + (statusCol.width - badge.w) / 2;
    const badgeY = y + (rowH - badge.h) / 2;
    drawStatusBadge(pdf, badgeX, badgeY, row.status || '—', style);
    x += statusCol.width;

    const hoursCol = columns[3];
    pdf.setFont(FONT, 'normal');
    setText(C.text);
    drawCellText([String(row.plannedTime ?? '—')], x, yMid, hoursCol, rowPadX);
    x += hoursCol.width;

    const fromCol = columns[4];
    drawCellText([row.from || '—'], x, yMid, fromCol, rowPadX);
    x += fromCol.width;

    const toCol = columns[5];
    drawCellText([row.to || '—'], x, yMid, toCol, rowPadX);

    y += rowH;
  });

  addFooter(pdf);
}
