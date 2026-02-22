export function normalizeCriteria(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(c => ({ text: (c.text || '').trim(), done: !!c.done }))
    .filter(c => c.text.length);
}

export function addCriteriaRow(text = '', done = false, target) {
  if (!target) return;
  const row = document.createElement('div');
  row.className = 'criteria-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'criteria-input';
  input.placeholder = 'Akzeptanzkriterium';
  input.value = text;
  input.dataset.done = done ? 'true' : 'false';
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'icon-square ghost criteria-remove';
  removeBtn.title = 'Entfernen';
  removeBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
  removeBtn.addEventListener('click', () => row.remove());
  row.append(input, removeBtn);
  target.appendChild(row);
}

export function resetCriteriaForm(criteria = [], target) {
  if (!target) return;
  target.innerHTML = '';
  const list = normalizeCriteria(criteria);
  if (!list.length) {
    addCriteriaRow('', false, target);
    return;
  }
  list.forEach(c => addCriteriaRow(c.text, c.done, target));
}

export function collectCriteriaFromForm(target) {
  const rows = Array.from(target?.querySelectorAll('.criteria-input') || []);
  return rows
    .map(inp => ({ text: inp.value.trim(), done: inp.dataset.done === 'true' }))
    .filter(c => c.text.length);
}

export function renderDetailCriteria(pkg, container) {
  if (!container) return;
  const list = normalizeCriteria(pkg?.acceptanceCriteria);
  if (!list.length) {
    container.innerHTML = '<span class="muted">Keine Akzeptanzkriterien definiert.</span>';
    return;
  }
  container.innerHTML = list.map((c, idx) => {
    const safe = (c.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `
      <label class="criteria-check" data-idx="${idx}">
        <input type="checkbox" ${c.done ? 'checked' : ''}>
        <span>${safe}</span>
      </label>
    `;
  }).join('');
}
