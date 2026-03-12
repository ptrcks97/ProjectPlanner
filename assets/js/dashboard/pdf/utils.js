import { fmt } from '../utils.js'; // Re-use vorhandene Datumformatierung

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-CH');
}

export { fmt };
