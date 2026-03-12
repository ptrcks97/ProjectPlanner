// Sammelstelle für einfache Layout-Helfer

export function pageSize(pdf) {
  return {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight()
  };
}
