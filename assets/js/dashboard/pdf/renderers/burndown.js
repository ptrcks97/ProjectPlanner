import { addFooter } from '../primitives/footer.js';
import { ensurePdfApi } from '../pdfApi.js';
import { fmtDate } from '../utils.js';

export function renderBurndownPdf(pdf, planRows, milestonesList, { startNewPage = true } = {}) {
  ensurePdfApi(pdf);
  if (startNewPage) pdf.addPage('a4', 'landscape');

  const margin = 28;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const chart = {
    x: margin,
    y: margin + 26,
    w: pageWidth - margin * 2,
    h: pageHeight - margin * 2 - 50
  };

  const total = planRows.reduce((s, p) => s + (Number(p.hours || p.time || 0) || 0), 0);

  const projectStart = planRows.length
    ? new Date(Math.min(...planRows.map(p => p.start)))
    : new Date();

  const projectEnd = planRows.length
    ? new Date(Math.max(...planRows.map(p => p.end)))
    : new Date(projectStart.getTime() + 86400000 * 7);

  projectStart.setHours(0, 0, 0, 0);
  projectEnd.setHours(0, 0, 0, 0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const actualEnd = today < projectEnd ? today : projectEnd;

  const daysAll = [];
  for (let t = projectStart.getTime(); t <= projectEnd.getTime(); t += 86400000) daysAll.push(new Date(t));

  const daysActual = [];
  for (let t = projectStart.getTime(); t <= actualEnd.getTime(); t += 86400000) daysActual.push(new Date(t));

  const idealRemaining = daysAll.map(d => {
    const donePlanned = planRows
      .filter(p => p.end && new Date(p.end) <= d)
      .reduce((s, p) => s + (Number(p.hours || p.time || 0) || 0), 0);
    return Math.max(0, total - donePlanned);
  });

  const actualRemaining = daysActual.map(d => {
    const completed = planRows
      .filter(p => (p.status || '').toLowerCase() === 'finished')
      .filter(p => {
        const done = p.doneDate ? new Date(p.doneDate) : null;
        return done && done <= d;
      })
      .reduce((s, p) => s + (Number(p.hours || p.time || 0) || 0), 0);
    return Math.max(0, total - completed);
  });

  const span = projectEnd - projectStart || 1;
  const scaleX = (date) => chart.x + ((date - projectStart) / span) * chart.w;
  const scaleY = (val) => chart.y + chart.h - (val / Math.max(total, 1)) * chart.h;

  // ---- Title ----
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(23, 37, 84);
  pdf.text('Burndown Chart', pageWidth / 2, margin - 6, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${fmtDate(projectStart)} – ${fmtDate(projectEnd)}`, pageWidth / 2, margin, { align: 'center' });

  // ---- Chart background ----
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(chart.x, chart.y, chart.w, chart.h, 4, 4, 'F');

  // ---- Grid + Y ticks ----
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = (total / yTicks) * i;
    const y = scaleY(val);
    pdf.line(chart.x, y, chart.x + chart.w, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${Math.round(val)} h`, chart.x - 6, y + 3, { align: 'right' });
  }

  // ---- X ticks (weekly) ----
  const totalDays = Math.round((projectEnd - projectStart) / 86400000);
  for (let i = 0; i <= totalDays; i += 7) {
    const d = new Date(projectStart.getTime() + i * 86400000);
    const x = scaleX(d);
    pdf.line(x, chart.y, x, chart.y + chart.h);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(d.toLocaleDateString('de-CH'), x, chart.y + chart.h + 8, { align: 'center' });
  }

  // ---- Lines ----
  pdf.setLineJoin('round');
  pdf.setLineCap('round');

  // Ideal
  pdf.setDrawColor(22, 163, 74);
  pdf.setLineWidth(1.0);
  pdf.lines(
    idealRemaining.map((val, i) => {
      if (i === 0) return [0, 0];
      return [
        scaleX(daysAll[i]) - scaleX(daysAll[i - 1]),
        scaleY(idealRemaining[i]) - scaleY(idealRemaining[i - 1])
      ];
    }),
    scaleX(daysAll[0]),
    scaleY(idealRemaining[0]),
    [1, 1],
    'S',
    false
  );

  // Actual
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(1.0);
  pdf.lines(
    actualRemaining.map((val, i) => {
      if (i === 0) return [0, 0];
      return [
        scaleX(daysActual[i]) - scaleX(daysActual[i - 1]),
        scaleY(actualRemaining[i]) - scaleY(actualRemaining[i - 1])
      ];
    }),
    scaleX(daysActual[0]),
    scaleY(actualRemaining[0]),
    [1, 1],
    'S',
    false
  );

  // ---- Milestones: robust rendering with label stacking (avoids overlaps) ----
  const milestones = Array.isArray(milestonesList) ? milestonesList.slice() : [];
  const parsedMilestones = milestones
    .map(ms => {
      const msDate = new Date(ms.date || ms.targetDate);
      if (Number.isNaN(msDate.getTime())) return null;
      return {
        ...ms,
        _date: msDate,
        _x: scaleX(msDate),
        _title: String(ms.title || 'Milestone')
      };
    })
    .filter(Boolean)
    .sort((a, b) => a._x - b._x);

  // how close labels can be before we stack them
  const minDx = 90;          // points
  const rowStep = 12;        // vertical separation between rows
  const baseTitleY = chart.y - 20;
  const baseDateY = chart.y - 13;

  const rowLastX = []; // last x used per row for collision handling

  pdf.setLineWidth(0.8);
  parsedMilestones.forEach(ms => {
    const x = ms._x;

    // Find first row where it doesn't collide; otherwise add new row
    let row = 0;
    while (row < rowLastX.length && (x - rowLastX[row]) < minDx) row++;
    rowLastX[row] = x;

    const titleY = baseTitleY - row * rowStep;
    const dateY  = baseDateY  - row * rowStep;

    // Always set colors per milestone to avoid "state leaks"
    pdf.setDrawColor(220, 38, 38);
    pdf.setFillColor(220, 38, 38);

    // line and marker
    pdf.line(x, chart.y, x, chart.y + chart.h);
    pdf.circle(x, chart.y - 6, 2, 'F');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(220, 38, 38);
    pdf.text(ms._title, x, titleY, { align: 'center' });

    // Date on next line
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`(${fmtDate(ms._date)})`, x, dateY, { align: 'center' });
  });

  // ---- Legend ----
  const legendY = pageHeight - margin + 6;
  const drawLegendItem = (color, label, x) => {
    pdf.setFillColor(...color);
    pdf.rect(x, legendY - 5, 6, 3, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, x + 10, legendY - 2);
  };

  drawLegendItem([22, 163, 74], 'Ideal', chart.x);
  drawLegendItem([37, 99, 235], 'Actual', chart.x + 80);
  drawLegendItem([220, 38, 38], 'Milestones', chart.x + 160);

  addFooter(pdf);
}