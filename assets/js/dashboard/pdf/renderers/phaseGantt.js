import { ensurePdfApi } from '../pdfApi.js';
import { addFooter } from '../primitives/footer.js';
import { clamp01, hslToRgb } from '../color.js';
import { fmtDate } from '../utils.js';

export function renderPhaseGanttPdf(pdf, phaseRanges) {
  ensurePdfApi(pdf);

  // --- Always render on a fresh A4 landscape page ---
  const initialPages = typeof pdf.getNumberOfPages === 'function' ? pdf.getNumberOfPages() : 1;
  pdf.addPage('a4', 'landscape');
  if (typeof pdf.setPage === 'function' && typeof pdf.getNumberOfPages === 'function') {
    pdf.setPage(pdf.getNumberOfPages());
  }
  // Optional: delete original first page if you know it was empty
  if (typeof pdf.deletePage === 'function' && initialPages === 1) {
    pdf.deletePage(1);
  }

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // --- Base layout ---
  const margin = 20;
  const topY = margin + 20;

  const labelW = Math.min(78, pageW * 0.30);
  const gap = 8;
  const chartX = margin + labelW + gap;
  const chartW = pageW - margin - chartX;

  // --- Fit-to-one-page: compute vertical scale ---
  const n = phaseRanges.length;

  const barH0 = 9;
  const rowGap0 = 10;

  // Reserve bottom space so footer doesn't overlap.
  // (If your addFooter is taller, increase this.)
  const bottomReserve = 34;

  const availableH = Math.max(1, pageH - topY - bottomReserve);
  const neededH0 = Math.max(1, n * (barH0 + rowGap0) - rowGap0);

  // Scale down only if needed, clamp to keep minimum readability
  const s = Math.max(0.45, Math.min(1, availableH / neededH0));

  const barH = Math.max(4.5, barH0 * s);
  const rowGap = Math.max(2.5, rowGap0 * s);

  // Slightly scale fonts when shrinking
  const titleFont = Math.max(10, 14 * (0.85 + 0.15 * s));
  const subFont = Math.max(7, 9 * s);
  const nameFont = Math.max(7.5, 10 * s);
  const dateFont = Math.max(6.5, 8.5 * s);
  const tickFont = Math.max(6, 7.5 * s);

  // --- Time domain ---
  const overallStart = Math.min(...phaseRanges.map(ph => ph.start?.getTime() ?? Infinity));
  const overallEnd = Math.max(...phaseRanges.map(ph => ph.end?.getTime() ?? -Infinity));
  const span = Math.max(1, overallEnd - overallStart);

  const scaleX = (date) => {
    const t = (date.getTime() - overallStart) / span;
    return chartX + clamp01(t) * chartW;
  };

  function phaseColorRGBByIndex(idx, total) {
  const t = total <= 1 ? 0 : idx / (total - 1);

  // Blau (210°) → Lila (280°)
  const hue = 210 + t * (280 - 210);

  // Pastell: niedrige Sättigung, hohe Lightness
  const saturation = 0.45;
  const lightness = 0.78;

  return hslToRgb(hue, saturation, lightness);
}

  const drawHeader = (visibleRows) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(titleFont);
    pdf.setTextColor(23, 37, 84);
    pdf.text('Projektphasen', pageW / 2, margin, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(subFont);
    pdf.setTextColor(90, 99, 116);
    pdf.text(
      `${fmtDate(new Date(overallStart))} – ${fmtDate(new Date(overallEnd))}`,
      pageW / 2,
      margin + 6 * (0.85 + 0.15 * s),
      { align: 'center' }
    );

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.line(margin, margin + 10 * (0.85 + 0.15 * s), pageW - margin, margin + 10 * (0.85 + 0.15 * s));

    const tickY0 = topY - 8 * s;
    const tickY1 = topY + (barH + rowGap) * visibleRows - rowGap + 2 * s;

    const dayMs = 86400000;
    const start = new Date(overallStart); start.setHours(0, 0, 0, 0);
    const dow = (start.getDay() + 6) % 7;
    const firstMonday = new Date(start.getTime() + ((7 - dow) % 7) * dayMs);

    pdf.setFontSize(tickFont);
    for (let t = firstMonday.getTime(), week = 0; t <= overallEnd; t += 7 * dayMs, week++) {
      const d = new Date(t);
      const x = scaleX(d);
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.4);
      pdf.line(x, tickY0, x, tickY1);

      if (week % 2 === 0) {
        pdf.setTextColor(148, 163, 184);
        pdf.text(d.toLocaleDateString('de-CH'), x, topY - 10 * s, { align: 'center' });
      }
    }
    pdf.setTextColor(33, 37, 41);
  };

  // --- Single page render (no pagination) ---
  drawHeader(n);

  let y = topY;
  phaseRanges.forEach((ph, idx) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(250, 251, 253);
      pdf.rect(margin, y - 2 * s, pageW - margin * 2, barH + rowGap - 2 * s, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(nameFont);
    pdf.setTextColor(23, 37, 84);
    pdf.text(String(ph.name || 'Phase'), margin, y + barH - 1 * s, { maxWidth: labelW });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(dateFont);
    pdf.setTextColor(90, 99, 116);
    const dateLine = (ph.start && ph.end) ? `${fmtDate(ph.start)} – ${fmtDate(ph.end)}` : '—';
    pdf.text(dateLine, margin, y + barH + 6 * s, { maxWidth: labelW });

    if (ph.start && ph.end) {
      const x0 = scaleX(ph.start);
      const x1 = scaleX(ph.end);
      const w = Math.max(2, x1 - x0);
      const [r, g, b] = phaseColorRGBByIndex(idx, phaseRanges.length);

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(chartX, y, chartW, barH, 2.5 * s, 2.5 * s, 'F');

      pdf.setFillColor(r, g, b);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x0, y, w, barH, 2.5 * s, 2.5 * s, 'F');
    }

    y += barH + rowGap;
  });

  addFooter(pdf);
}