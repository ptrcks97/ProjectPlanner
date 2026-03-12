// Barrel file für PDF-Bausteine
export { STATUS_STYLE, FOOTER_TEXT } from './constants.js';
export { ensurePdfApi, ptToUnit, textBaselineYOffset } from './pdfApi.js';
export { clamp01, hslToRgb } from './color.js';
export { pageSize } from './layout.js';
export { fmtDate, fmt } from './utils.js';

// Primitives
export { addFooter } from './primitives/footer.js';
export { measureStatusBadge, drawStatusBadge } from './primitives/statusBadge.js';
export { attachPageBackground } from './primitives/background.js';

// Renderers
export { renderPlanCoverPage } from './renderers/coverPage.js';
export { sectionTitlePage } from './renderers/sectionTitlePage.js';
export { renderPlanTableSection } from './renderers/planTableSection.js';
export { renderWorkPackageTable } from './renderers/workPackageTable.js';
export { renderPhaseGanttPdf } from './renderers/phaseGantt.js';
export { renderBurndownPdf } from './renderers/burndown.js';
export { renderJournalTable } from './renderers/journalTable.js';

// Guards
export { enableNoBlankPagesGuard } from './guards/noBlankPagesGuard.js';
