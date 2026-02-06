export function fmt(date) {
  return date ? date.toLocaleDateString('de-CH') : '-';
}

export function statusChip(status) {
  const key = (status || 'Backlog').toLowerCase();
  const cls = key === 'todo' ? 'status-todo'
    : key === 'warten' ? 'status-warten'
    : key === 'onhold' ? 'status-onhold'
    : key === 'finished' ? 'status-finished'
    : 'status-backlog';
  return `<span class="status-chip ${cls}"><span class="dot"></span>${status || 'Backlog'}</span>`;
}

export function startOfWeek(date) {
  const res = new Date(date);
  const day = res.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  res.setDate(res.getDate() + diff);
  res.setHours(0, 0, 0, 0);
  return res;
}

export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
