import { apiRequest } from './api.js';
import { KANBAN_STATUSES, KANBAN_LABELS, KANBAN_COLOR } from './constants.js';
import { normalizeCriteria } from './criteria.js';

export function renderKanbanPhaseOptions(phases, selectEl) {
  if (!selectEl) return;
  const previous = selectEl.value;
  if (!phases.length) {
    selectEl.innerHTML = '<option value="">(keine Phasen)</option>';
    return;
  }
  selectEl.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  const found = phases.find(p => String(p.id) === previous);
  selectEl.value = found ? previous : (phases[0]?.id ?? '');
}

export function renderKanbanBoard({ boardEl, phaseSelectEl, phases, packages, onStatusChange }) {
  if (!boardEl || !phaseSelectEl) return;
  const selectedPhase = Number(phaseSelectEl.value || phases[0]?.id || 0);
  const list = packages.filter(p => !selectedPhase || p.phaseId === selectedPhase);
  boardEl.innerHTML = KANBAN_STATUSES.map(status => {
    const items = list.filter(p => (p.status || 'Backlog') === status);
    return `
      <div class="kanban-column" data-status="${status}">
        <div class="kanban-head"><span>${KANBAN_LABELS[status]}</span><span style="font-size:12px;color:var(--muted);">${items.length}</span></div>
        <div class="kanban-cards" data-status="${status}">
          ${items.map(renderKanbanCard).join('')}
        </div>
      </div>
    `;
  }).join('');
  attachKanbanDnD(boardEl, async (id, status) => {
    await updateKanbanStatus(id, status, packages);
    if (onStatusChange) await onStatusChange();
  });
}

function renderKanbanCard(item) {
  const color = KANBAN_COLOR[item.status] || '#94a3b8';
  const dot = `<span class="status-dot" style="background:${color};"></span>`;
  return `<div class="kanban-card" draggable="true" data-id="${item.id}" data-status="${item.status || 'Backlog'}">
    <h4>${dot}${item.name}</h4>
    ${item.description ? `<p>${item.description.slice(0, 120)}</p>` : ''}
  </div>`;
}

function attachKanbanDnD(boardEl, onDrop) {
  const cards = boardEl.querySelectorAll('.kanban-card');
  let dragId = null;
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      dragId = Number(card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragId = null;
      boardEl.querySelectorAll('.kanban-droptarget').forEach(c => c.classList.remove('kanban-droptarget'));
    });
  });
  boardEl.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('kanban-droptarget');
    });
    col.addEventListener('dragleave', () => col.classList.remove('kanban-droptarget'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('kanban-droptarget');
      if (!dragId) return;
      const targetStatus = col.dataset.status;
      const cardEl = boardEl.querySelector(`.kanban-card[data-id="${dragId}"]`);
      if (cardEl && cardEl.dataset.status !== targetStatus) {
        await onDrop(dragId, targetStatus);
      }
    });
  });
}

async function updateKanbanStatus(id, status, packages) {
  const pkg = packages.find(p => p.id === id);
  if (!pkg) return;
  let criteria = normalizeCriteria(pkg.acceptanceCriteria);
  if (status === 'Finished' && criteria.some(c => !c.done)) {
    const confirmFinish = window.confirm('Nicht alle Akzeptanzkriterien sind erledigt. Willst du alle als erledigt markieren und abschliessen?');
    if (!confirmFinish) return;
    criteria = criteria.map(c => ({ ...c, done: true }));
  }
  const body = {
    ...pkg,
    status,
    acceptanceCriteria: criteria,
    doneDate: status === 'Finished' ? (pkg.doneDate || new Date().toISOString()) : null
  };
  const res = await apiRequest(`/workPackages/${id}`, { method: 'PUT', body });
  if (!res.ok) console.error('Kanban Update failed');
}
