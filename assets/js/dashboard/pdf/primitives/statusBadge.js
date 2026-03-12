import { STATUS_STYLE } from '../constants.js';
import { ensurePdfApi, ptToUnit, textBaselineYOffset } from '../pdfApi.js';

export function measureStatusBadge(pdf, text, style) {
  const cfg = style || STATUS_STYLE.backlog;
  ensurePdfApi(pdf);

  const fontSizePt = 9.5;
  const padX = 2.6;
  const padY = 1.7;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSizePt);

  const label = (text || '—').toString().trim();
  const textW = pdf.getTextWidth(label);
  const fontH = ptToUnit(pdf, fontSizePt);

  const h = fontH + padY * 2;
  const w = Math.min(42, textW + padX * 2);

  return { label, fontSizePt, padX, padY, w, h };
}

export function drawStatusBadge(pdf, x, y, text, style) {
  const cfg = style || STATUS_STYLE.backlog;
  const m = measureStatusBadge(pdf, text, cfg);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(m.fontSizePt);

  pdf.setFillColor(cfg.bg || '#E8F0FE');
  pdf.setDrawColor(cfg.bg || '#E8F0FE');
  pdf.roundedRect(x, y, m.w, m.h, 3.8, 3.8, 'F');

  pdf.setTextColor(cfg.text || '#1A56DB');
  const yText = y + (m.h / 2) + textBaselineYOffset(pdf, m.fontSizePt);
  pdf.text(m.label, x + (m.w / 2), yText, { align: 'center' });

  pdf.setTextColor(33, 37, 41);
  return { width: m.w, height: m.h };
}
