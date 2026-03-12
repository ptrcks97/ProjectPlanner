export function ensurePdfApi(pdf) {
  const proto = Object.getPrototypeOf(pdf) || pdf;
  const tryDefine = (name, fn) => {
    if (typeof pdf[name] === 'function') return;
    try { Object.defineProperty(proto, name, { value: fn, writable: true, configurable: true }); } catch (_) {}
  };

  tryDefine('setFont', function () { return this; });
  tryDefine('setFontSize', function () { return this; });
  tryDefine('setCharSpace', function () { return this; });
  tryDefine('getTextWidth', function (text) {
    const fontSize = (this.internal?.getFontSize?.() || 12);
    const sf = (this.internal && typeof this.internal.scaleFactor === 'number') ? this.internal.scaleFactor : 1;
    const unitWidth = (fontSize * 0.55) * sf / 72;
    return String(text || '').length * unitWidth;
  });
}

export function ptToUnit(pdf, pt) {
  const sf = (pdf.internal && typeof pdf.internal.scaleFactor === 'number') ? pdf.internal.scaleFactor : 1;
  return pt / sf;
}

export function textBaselineYOffset(pdf, fontSizePt) {
  // 0.35em ist ein guter Näherungswert für Helvetica in jsPDF
  return ptToUnit(pdf, fontSizePt) * 0.35;
}
