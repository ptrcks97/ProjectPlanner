import { fmt, statusChip } from './utils.js';

function resolvePhaseName(pid, phases) {
  if (pid === null || pid === undefined) return 'Ohne Phase';
  const ph = phases.find(p => p.id === pid);
  return ph ? ph.name : 'Ohne Phase';
}

export function renderPlanTable(plan, phases, target) {
  if (!target) return;
  if (!plan.length) {
    target.innerHTML = '<tr><td colspan="7">Keine Arbeitspakete vorhanden.</td></tr>';
    return;
  }
  target.innerHTML = plan.map(p => {
    const warn = (p.phaseId === null || p.phaseId === undefined) ? '<span class="warn">!</span>' : '';
    return `
      <tr class="task-row" data-task-id="${p.id}">
        <td>${resolvePhaseName(p.phaseId, phases)}</td>
        <td>${p.name} ${warn}</td>
        <td>${statusChip(p.status || 'ToDo')}</td>
        <td>${p.hours}</td>
        <td>${fmt(p.start)}</td>
        <td>${fmt(p.end)}</td>
        <td>
          <button class="icon-square" title="Bearbeiten" data-edit="${p.id}"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-square danger" title="Loeschen" data-delete="${p.id}"><span class="material-symbols-rounded">delete</span></button>
        </td>
      </tr>
    `;
  }).join('');
}

export function renderPhaseGrouped(plan, phases, container) {
  if (!container) return;
  if (!plan.length) {
    container.innerHTML = '<div class="muted">Keine Arbeitspakete vorhanden.</div>';
    return;
  }
  const groups = {};
  for (const p of plan) {
    const key = p.phaseId ?? 'none';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  const phaseName = (pid) => {
    if (pid === 'none') return 'Ohne Phase';
    return resolvePhaseName(Number(pid), phases);
  };
  const order = Object.keys(groups).sort((a, b) => {
    const ia = phases.findIndex(p => p.id === (a === 'none' ? null : Number(a)));
    const ib = phases.findIndex(p => p.id === (b === 'none' ? null : Number(b)));
    const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    return sa - sb;
  });
  container.innerHTML = order.map(key => {
    const list = groups[key];
    const title = phaseName(key);
    const showWarn = key === 'none';
    const rowsHtml = list.map(p => `
      <tr draggable="true" class="task-row" data-phase-row="${p.phaseId ?? 'none'}" data-id="${p.id}">
        <td>${p.name} ${showWarn ? '<span class="warn">!</span>' : ''}</td>
        <td>${statusChip(p.status || 'ToDo')}</td>
        <td>${p.hours}</td>
        <td>${fmt(p.start)}</td>
        <td>${fmt(p.end)}</td>
        <td>
          <button class="icon-square" title="Bearbeiten" data-edit="${p.id}"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-square danger" title="Loeschen" data-delete="${p.id}"><span class="material-symbols-rounded">delete</span></button>
        </td>
      </tr>
    `).join('');
    return `
      <h3 style="margin:12px 0 6px;">${title}</h3>
      <table>
        <thead>
          <tr>
            <th>Arbeitspaket</th><th>Status</th><th>Stunden</th><th>Start</th><th>Ende</th><th>Aktion</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }).join('');
}
