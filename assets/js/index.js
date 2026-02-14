(() => {
  const API_URL = '/projects';
  const form = document.getElementById('project-form');
  const rows = document.getElementById('project-rows');
  const status = document.getElementById('status');
  const helpBtn = document.getElementById('help-btn');
  const helpPanel = document.getElementById('help-panel');
  const helpClose = helpPanel?.querySelector('.help-close');

  function toggleHelp(force) {
    if (!helpPanel) return;
    const willShow = force ?? helpPanel.classList.contains('hidden');
    helpPanel.classList.toggle('hidden', !willShow);
  }

  helpBtn?.addEventListener('click', () => toggleHelp());
  helpClose?.addEventListener('click', () => toggleHelp(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleHelp(false);
  });
  document.addEventListener('click', (e) => {
    if (!helpPanel || helpPanel.classList.contains('hidden')) return;
    if (helpPanel.contains(e.target) || helpBtn?.contains(e.target)) return;
    toggleHelp(false);
  });

  async function loadProjects() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      renderRows(data);
      setStatus('Projekte geladen.');
    } catch (err) {
      setStatus('Konnte Projekte nicht laden (' + err.message + ').', true);
      rows.innerHTML = '<tr><td colspan="4">Keine Daten verfügbar.</td></tr>';
    }
  }

  function renderRows(list) {
    if (!list.length) {
      rows.innerHTML = '<tr><td colspan="4">Noch keine Projekte.</td></tr>';
      return;
    }
    rows.innerHTML = list.map(
      (p) => `
        <tr>
          <td><a href="dashboard.html?id=${p.id}" style="color: var(--accent); text-decoration: none;">${p.name}</a></td>
          <td>${p.hours}</td>
          <td>${p.id ?? '-'}</td>
          <td><button class="ghost" data-delete="${p.id}">Löschen</button></td>
        </tr>
      `
    ).join('');
  }

  function setStatus(text, isError = false) {
    status.textContent = text;
    status.classList.toggle('error', isError);
  }

  form?.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const name = document.getElementById('project-name').value.trim();
    const hours = Number(document.getElementById('project-hours').value);

    if (!name) {
      setStatus('Name darf nicht leer sein.', true);
      return;
    }
    if (Number.isNaN(hours)) {
      setStatus('Bitte eine Stundenanzahl angeben.', true);
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hours })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      await loadProjects();
      setStatus('Projekt gespeichert.');
    } catch (err) {
      setStatus('Speichern fehlgeschlagen (' + err.message + ').', true);
    }
  });

  rows?.addEventListener('click', async (evt) => {
    const btn = evt.target.closest('[data-delete]');
    if (!btn) return;
    const id = Number(btn.dataset.delete);
    const name = btn.closest('tr')?.querySelector('td')?.textContent || 'Projekt';
    if (!window.confirm(`${name} wirklich löschen? Phasen, Arbeitspakete, Wochenpläne und Start werden mitgelöscht.`)) return;
    try {
      setStatus('Lösche Projekt...');
      await deleteCollection(`/phases?projectId=${id}`, 'phases');
      await deleteCollection(`/workPackages?projectId=${id}`, 'workPackages');
      await deleteCollection(`/weeklyPlans?projectId=${id}`, 'weeklyPlans');
      await deleteCollection(`/projectStarts?projectId=${id}`, 'projectStarts');
      const res = await fetch(`/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await loadProjects();
      setStatus('Projekt gelöscht.');
    } catch (err) {
      setStatus('Löschen fehlgeschlagen (' + err.message + ').', true);
    }
  });

  async function deleteCollection(url, name) {
    const res = await fetch(url);
    if (!res.ok) return;
    const items = await res.json();
    for (const item of items) {
      await fetch(`/${name}/${item.id}`, { method: 'DELETE' });
    }
  }

  loadProjects();
})();
