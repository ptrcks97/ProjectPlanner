export function enableNoBlankPagesGuard(pdf) {
  const touched = new Map();

  const getPageNumber = () => {
    try {
      return pdf.internal.getCurrentPageInfo().pageNumber;
    } catch (_) {
      return pdf.internal.getNumberOfPages?.() ?? 1;
    }
  };

  const markTouched = () => {
    const p = getPageNumber();
    touched.set(p, true);
  };

  touched.set(getPageNumber(), false);

  const wrap = (name) => {
    const fn = pdf[name];
    if (typeof fn !== 'function') return;
    pdf[name] = function (...args) {
      markTouched();
      return fn.apply(this, args);
    };
  };

  [
    'text',
    'rect',
    'roundedRect',
    'line',
    'lines',
    'circle',
    'ellipse',
    'polygon',
    'addImage'
  ].forEach(wrap);

  const origAddPage = pdf.addPage;
  if (typeof origAddPage === 'function') {
    pdf.addPage = function (...args) {
      const cur = getPageNumber();
      const isTouched = touched.get(cur) === true;

      if (!isTouched && typeof pdf.deletePage === 'function') {
        try { pdf.deletePage(cur); } catch (_) {}
      }

      const res = origAddPage.apply(this, args);
      touched.set(getPageNumber(), false);
      return res;
    };
  }

  return pdf;
}
