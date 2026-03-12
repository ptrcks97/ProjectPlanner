import { fmt } from '../utils.js';
import { addFooter } from '../primitives/footer.js';
import { ensurePdfApi } from '../pdfApi.js';

export function renderPlanCoverPage(
  pdf,
  coverImageData,
  { planCache = [], projectTitle = 'Projekt', projectId = '-', today = new Date() } = {}
) {
  ensurePdfApi(pdf);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (coverImageData) {
    const props = pdf.getImageProperties(coverImageData);
    const ratio = Math.min(pageWidth / props.width, pageHeight / props.height);
    const w = props.width * ratio;
    const h = props.height * ratio;
    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;
    pdf.addImage(coverImageData, 'PNG', x, y, w, h, undefined, 'FAST');
    return;
  }

  const margin = 48;
  const innerWidth = pageWidth - margin * 2;
  const todayText = today.toLocaleDateString('de-CH');

  const minStart = planCache.length ? new Date(Math.min(...planCache.map(p => p.start))) : null;
  const maxEnd = planCache.length ? new Date(Math.max(...planCache.map(p => p.end))) : null;
  const totalHours = planCache.reduce((s, p) => s + (Number(p.hours || p.time || 0) || 0), 0);
  const finishedCount = planCache.filter(p => (p.status || '').toLowerCase() === 'finished').length;

  pdf.setFillColor(244, 247, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setTextColor(28, 37, 64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text(projectTitle, margin, margin + 18);

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Plan-Export', margin, margin + 44);
  pdf.setFontSize(11);
  pdf.setTextColor(76, 86, 106);
  pdf.text(`Stand: ${todayText}`, margin, margin + 62);

  const cards = [
    { label: 'Gesamtpakete', value: planCache.length },
    { label: 'Abgeschlossen', value: finishedCount },
    { label: 'Geplante Stunden', value: `${totalHours.toFixed(1)} h` },
    { label: 'Plan-Start', value: minStart ? fmt(minStart) : '-' },
    { label: 'Plan-Ende', value: maxEnd ? fmt(maxEnd) : '-' },
    { label: 'Projekt-ID', value: projectId || '-' }
  ];

  const cardCols = 3;
  const gap = 14;
  const cardWidth = (innerWidth - gap * (cardCols - 1)) / cardCols;
  const cardHeight = 70;
  const y0 = margin + 90;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  cards.forEach((card, idx) => {
    const col = idx % cardCols;
    const row = Math.floor(idx / cardCols);
    const x = margin + col * (cardWidth + gap);
    const boxY = y0 + row * (cardHeight + gap);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(225, 231, 239);
    pdf.roundedRect(x, boxY, cardWidth, cardHeight, 8, 8, 'FD');

    pdf.setTextColor(102, 112, 133);
    pdf.text(card.label, x + 10, boxY + 18);

    pdf.setTextColor(23, 37, 84);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(String(card.value), x + 10, boxY + 42);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
  });

  addFooter(pdf);
}
