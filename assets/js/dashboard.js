import { apiRequest } from './dashboard/api.js';
import { fmt, isoWeek, startOfWeek, statusChip } from './dashboard/utils.js';

const params = new URLSearchParams(window.location.search);
    const projectId = Number(params.get('id'));
    const status = document.getElementById('status');
    const title = document.getElementById('title');
    const meta = document.getElementById('meta');
    const rows = document.getElementById('rows');
    const back = document.getElementById('back-link');
    const cardStart = document.getElementById('start-date');
    const cardHours = document.getElementById('hours-total');
    const cardDays = document.getElementById('days-total');
    const topToggleBtns = Array.from(document.querySelectorAll('.top-toggle-btn, [data-top-view-btn]'));
    const topViews = Array.from(document.querySelectorAll('.top-view'));
    const kanbanPhaseSelect = document.getElementById('kanban-phase');
    const kanbanBoard = document.getElementById('kanban-board');
    const kanbanReload = document.getElementById('kanban-reload');

    // Nav panels
    const tabPhases = document.getElementById('tab-phases');
    const tabWeek = document.getElementById('tab-week');
    const tabStart = document.getElementById('tab-start');
    const tabTask = document.getElementById('tab-task');
    const panelPhases = document.getElementById('panel-phases');
    const panelWeek = document.getElementById('panel-week');
    const panelStart = document.getElementById('panel-start');
    const panelTask = document.getElementById('panel-task');

    const viewButtons = Array.from(document.querySelectorAll('.view-btn'));
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const viewPlan = document.getElementById('view-plan');
    const viewPhase = document.getElementById('view-phase');
    const viewChart = document.getElementById('view-chart');
    const filterGroup = document.getElementById('filter-group');
    const phaseView = document.getElementById('phase-view');
    const chartView = document.getElementById('view-chart');
    const chartContainer = document.getElementById('chart-container');
    const chartPrev = document.getElementById('chart-prev');
    const chartNext = document.getElementById('chart-next');
    const chartLabel = document.getElementById('chart-label');
    const chartImageExportBtn = document.getElementById('chart-export-img');
    const chartTypes = ['health', 'gantt', 'phasegantt', 'pie', 'bar', 'burndown'];
    const chartZoomBtn = document.getElementById('chart-zoom');
    let isZoomed = false;
    let chartIndex = 0;
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    let currentView = 'plan';
    // Help
    const helpBtn = document.getElementById('help-btn');
    const helpPanel = document.getElementById('help-panel');
    const helpClose = helpPanel?.querySelector('.help-close');
    const helpTitle = document.getElementById('help-title');
    const helpBody = document.getElementById('help-body');
    const helpList = document.getElementById('help-list');

    // Journal
    const journalForm = document.getElementById('journal-form');
    const journalRows = document.getElementById('journal-rows');
    const journalStatus = document.getElementById('journal-status');
    const journalCount = document.getElementById('journal-count');
    const journalTotal = document.getElementById('journal-total');
    const journalDate = document.getElementById('journal-date');
    const journalPhaseSelect = document.getElementById('journal-phase');
    const journalPackageSelect = document.getElementById('journal-package');
    const journalSubmitBtn = document.getElementById('journal-submit');
    const journalCancelBtn = document.getElementById('journal-cancel');
    const journalSumCell = document.getElementById('journal-sum');
    const downloadToggle = document.getElementById('download-toggle');
    const downloadPanel = document.getElementById('download-panel');

    // Forecast view
    const forecastRows = document.getElementById('forecast-rows');
    const forecastStatus = document.getElementById('forecast-status');
    const forecastCardStart = document.getElementById('forecast-start-date');
    const forecastCardHours = document.getElementById('forecast-hours-total');
    const forecastCardDays = document.getElementById('forecast-days-total');
    const forecastCardEnd = document.getElementById('forecast-end-date');
    const forecastCardWeek = document.getElementById('forecast-week-avg');
    const JOURNAL_KEY_PREFIX = 'work-journal-project-';
    let journalEntries = [];
    let journalEditIndex = null;

    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMode = document.getElementById('modal-mode');
    const taskForm = document.getElementById('task-form');
    const taskPhase = document.getElementById('task-phase');
    const taskName = document.getElementById('task-name');
    const taskDesc = document.getElementById('task-desc');
    const taskTime = document.getElementById('task-time');
    const taskStatus = document.getElementById('task-status');
    const taskParallel = document.getElementById('task-parallel');
    const taskSpread = document.getElementById('task-spread');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');

    // Detail modal (read-only)
    const detailModal = document.getElementById('task-detail-modal');
    const detailClose = document.getElementById('close-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-desc');
    const detailPhase = document.getElementById('detail-phase');
    const detailStatus = document.getElementById('detail-status');
    const detailStatusPlain = document.getElementById('detail-status-plain');
    const detailHours = document.getElementById('detail-hours');
    const detailStart = document.getElementById('detail-start');
    const detailEnd = document.getElementById('detail-end');
    const detailId = document.getElementById('detail-id');
    const detailParallel = document.getElementById('detail-parallel');
    const detailSpread = document.getElementById('detail-spread');
    // inline task form
    const inlineTaskForm = document.getElementById('inline-task-form');
    const inlineTaskPhase = document.getElementById('inline-task-phase');
    const inlineTaskName = document.getElementById('inline-task-name');
    const inlineTaskDesc = document.getElementById('inline-task-desc');
    const inlineTaskStatus = document.getElementById('inline-task-status');
    const inlineTaskParallel = document.getElementById('inline-task-parallel');
    const inlineTaskSpread = document.getElementById('inline-task-spread');
    const inlineTaskTime = document.getElementById('inline-task-time');
    const reloadBtn = document.getElementById('reload-btn');
    let editingId = null;

    // Phase form elements
    const phaseForm = document.getElementById('phase-form');
    const phaseIdInput = document.getElementById('phase-id');
    const phaseNameInput = document.getElementById('phase-name');
    const phaseDescInput = document.getElementById('phase-desc');
    const phaseColorInput = document.getElementById('phase-color');
    const phaseRows = document.getElementById('phase-rows');

    // Week form inputs
    const weekInputs = {
      monday: document.getElementById('mon'),
      tuesday: document.getElementById('tue'),
      wednesday: document.getElementById('wed'),
      thursday: document.getElementById('thu'),
      friday: document.getElementById('fri'),
      saturday: document.getElementById('sat'),
      sunday: document.getElementById('sun'),
    };

    function hasWeeklyCapacity() {
      const currentInputs = Object.values(weekInputs).some(inp => Number(inp?.value || 0) > 0);
      if (currentInputs) return true;
      if (!weekly) return false;
      return ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        .some(k => Number(weekly[k] || 0) > 0);
    }

    /* ---------- Hilfe ---------- */
    function helpKey(viewOverride) {
      if (viewOverride && HELP_COPY[viewOverride]) return viewOverride;
      const topActive = document.querySelector('.top-view.active');
      if (topActive?.id === 'top-forecast') return 'forecast';
      if (topActive?.id === 'top-journal') return 'journal';
      if (topActive?.id === 'top-kanban') return 'kanban';
      if (currentView === 'phase') return 'phase';
      if (currentView === 'chart') return 'chart';
      return 'plan';
    }

    function renderHelp(viewOverride) {
      if (!helpPanel) return;
      const key = helpKey(viewOverride);
      const copy = HELP_COPY[key] || HELP_COPY.plan;
      if (helpTitle) helpTitle.textContent = copy.title;
      if (helpBody) helpBody.textContent = copy.body;
      if (helpList) {
        helpList.innerHTML = (copy.bullets || []).map(line => `<li>${line}</li>`).join('');
      }
    }

    function toggleHelp(force) {
      if (!helpPanel) return;
      const willShow = force ?? helpPanel.classList.contains('hidden');
      helpPanel.classList.toggle('hidden', !willShow);
    }

    function syncHelpVisibility() {
      const hide = isFullscreen && currentView === 'chart';
      if (helpBtn) helpBtn.classList.toggle('hidden', hide);
      if (hide) helpPanel?.classList.add('hidden');
    }

    helpBtn?.addEventListener('click', () => toggleHelp());
    helpClose?.addEventListener('click', () => toggleHelp(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleHelp(false); });
    document.addEventListener('click', (e) => {
      if (!helpPanel || helpPanel.classList.contains('hidden')) return;
      if (helpPanel.contains(e.target) || helpBtn?.contains(e.target)) return;
      toggleHelp(false);
    });

    // Start form inputs
    const startDateInput = document.getElementById('start-date-input');
    const durationHoursInput = document.getElementById('duration-hours');

    let phases = [];
    let packages = [];
    let weekly = null;
    let startStr = null;
    let planCache = [];
    let filterMode = 'all';

    const KANBAN_STATUSES = ['Backlog', 'ToDo', 'Warten', 'OnHold', 'Finished'];
    const KANBAN_LABELS = {
      Backlog: 'Backlog',
      ToDo: 'To Do',
      Warten: 'Warten',
      OnHold: 'On Hold',
      Finished: 'Finished'
    };
    const KANBAN_COLOR = {
      Backlog: '#64748b',
      ToDo: '#22d3ee',
      Warten: '#f59e0b',
      OnHold: '#ef4444',
      Finished: '#22c55e'
    };
    const HELP_COPY = {
      plan: {
        title: 'Plan',
        body: 'Zeitplan aller Arbeitspakete in Reihenfolge. Filtere nach Heute/Woche/Monat und bearbeite über die Stift-Icons.',
        bullets: [
          'Parallel/Projektweit markierte Pakete behalten ihre Logik im Plan.',
          'Exports: Diagramme im Tab „Diagramme“ (Bild/PDF) erstellen.',
          'Arbeitsjournal-Exports (CSV, Markdown, PDF) unter „Arbeitsjournal“.'
        ]
      },
      phase: {
        title: 'Nach Phase',
        body: 'Arbeitspakete gruppiert nach Phase, per Drag & Drop innerhalb einer Phase neu sortieren.',
        bullets: [
          'Ausrufezeichen bedeutet: Paket ohne Phase.',
          'Exports wie oben über „Diagramme“ bzw. „Arbeitsjournal“.'
        ]
      },
      chart: {
        title: 'Diagramme',
        body: 'Blättere mit < und > durch Gantt, Phasen-Gantt, Pie, Bar, Burndown. Volle Breite per „Fullscreen“.',
        bullets: [
          'Bild Export: Button rechts (PNG).',
          'PDF: „Bild Export“ + PDF-Export-Button, mehrere Charts werden gesammelt.',
          'Fullscreen blendet die Hilfe aus; mit „Schliessen“ zurück.'
        ]
      },
      forecast: {
        title: 'Vorhersage',
        body: 'Theoretischer Plan ab heute mit allen offenen Paketen. Daten bleiben unverändert.',
        bullets: [
          'Nutze, um schnell das erwartete Enddatum zu sehen.',
          'Exports: wechsle zu „Diagramme“ für Bild/PDF; Journal-Exports wie gewohnt.'
        ]
      },
      journal: {
        title: 'Arbeitsjournal',
        body: 'Zeiterfassung pro Tag. Pakete optional zuordenbar.',
        bullets: [
          'Download-Menü: CSV (voll/reduced), Markdown, PDF/Screenshot.',
          'Bearbeiten/Löschen direkt in der Tabelle.'
        ]
      },
      kanban: {
        title: 'Kanban',
        body: 'Statusbasierte Übersicht für die ausgewählte Phase. Karten per Drag & Drop verschieben.',
        bullets: [
          'Statuswechsel aktualisiert den Plan automatisch.',
          'Exports: Diagramme & Journal wie oben.'
        ]
      }
    };

    if (projectId) back.href = `index.html`;

    function setTopView(view) {
      topViews.forEach(v => v.classList.toggle('active', v.id === `top-${view}`));
      topToggleBtns.forEach(btn => {
        const target = btn.dataset.topView || btn.dataset.topViewBtn;
        btn.classList.toggle('active', target === view);
        if (btn.dataset.topViewBtn === 'journal') {
          viewButtons.forEach(vb => vb.classList.toggle('active', vb.dataset.view === 'journal'));
        }
      });
      renderHelp(view);
      syncHelpVisibility();
      if (view === 'journal') {
        viewButtons.forEach(vb => vb.classList.remove('active'));
        return;
      }
      if (view === 'forecast') {
        viewButtons.forEach(vb => vb.classList.remove('active'));
        renderForecast();
        return;
      }
      if (view === 'kanban') {
        renderKanbanBoard();
        return;
      }
      renderCurrentView();
    }
    topToggleBtns.forEach(btn => btn.addEventListener('click', () => setTopView(btn.dataset.topView || btn.dataset.topViewBtn)));

    function setStatus(text, isError = false) {
      status.textContent = text;
      status.classList.toggle('error', isError);
    }

    async function loadProject() {
      const res = await apiRequest(`/projects/${projectId}`);
      if (!res.ok) throw new Error('Projekt nicht gefunden');
      const p = await res.json();
      title.textContent = p.name;
    }

    async function loadStart() {
      const res = await apiRequest(`/projectStarts?projectId=${projectId}`);
      if (!res.ok) return;
      const arr = await res.json();
      if (!arr.length) {
        startStr = null;
        startDateInput.value = '';
        durationHoursInput.value = '';
        return;
      }
      startStr = arr[0].startDate;
      startDateInput.value = startStr;
      if (arr[0].durationHours !== undefined) {
        durationHoursInput.value = arr[0].durationHours;
      }
    }

    async function loadWeekly() {
      const res = await apiRequest(`/weeklyPlans?projectId=${projectId}`);
      if (!res.ok) return null;
      const arr = await res.json();
      weekly = arr[0] || null;
      if (weekly) {
        Object.entries(weekInputs).forEach(([k, input]) => {
          input.value = weekly[k] ?? 0;
        });
      }
    }

    async function loadPhases() {
      const res = await apiRequest(`/phases?projectId=${projectId}`);
      if (!res.ok) return;
      const arr = await res.json();
      phases = arr.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      renderPhaseList();
      renderJournalPhaseOptions();
      renderTaskPhaseOptions();
    }

    async function loadPackages() {
      const res = await apiRequest(`/workPackages`);
      if (!res.ok) return;
      const arr = await res.json();
      const phaseIds = new Set(phases.map(p => p.id));
      packages = arr.filter(w => w.projectId === projectId || phaseIds.has(w.phaseId));
      renderJournalPackageOptions();
    }

    /* ---------- Arbeitsjournal ---------- */
    function journalKey() {
      return `${JOURNAL_KEY_PREFIX}${projectId || 'unknown'}`;
    }

    function renderJournalPhaseOptions() {
      if (!journalPhaseSelect) return;
      if (!phases.length) {
        journalPhaseSelect.innerHTML = `
          <option value="Planung">Planung</option>
          <option value="Work">Work</option>
          <option value="Support">Support</option>
        `;
        return;
      }
      journalPhaseSelect.innerHTML = phases.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    }

    function renderTaskPhaseOptions() {
      if (taskPhase) {
        taskPhase.innerHTML = `<option value="">(keine Phase)</option>` + phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }
      if (inlineTaskPhase) {
        inlineTaskPhase.innerHTML = `<option value="">(keine Phase)</option>` + phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }
    }

    function renderJournalPackageOptions() {
      if (!journalPackageSelect) return;
      if (!packages.length) {
        journalPackageSelect.innerHTML = '<option value="">(keine Pakete vorhanden)</option>';
        return;
      }
      journalPackageSelect.innerHTML = '<option value="">(optional auswählen)</option>' + packages.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    function loadJournal() {
      const raw = localStorage.getItem(journalKey());
      journalEntries = raw ? JSON.parse(raw) : [];
      renderJournal();
    }

    function persistJournal() {
      localStorage.setItem(journalKey(), JSON.stringify(journalEntries));
    }

    function renderJournal() {
      if (!journalRows) return;
      if (!journalEntries.length) {
        journalRows.innerHTML = '<tr><td colspan="7">Noch keine Einträge.</td></tr>';
        journalCount.textContent = '0';
        journalTotal.textContent = '0.00 h';
        if (journalSumCell) journalSumCell.textContent = '0.00';
        return;
      }
      journalRows.innerHTML = journalEntries.map((entry, idx) => `
        <tr>
          <td>${entry.title}</td>
          <td>${entry.description}</td>
          <td><span class="chip">${entry.phase || '-'}</span></td>
          <td>${entry.packageName || '-'}</td>
          <td>${entry.hours}</td>
          <td>${entry.date}</td>
          <td>
            <button class="ghost" data-edit-journal="${idx}">Bearbeiten</button>
            <button class="ghost" data-remove="${idx}" style="margin-left:6px;">Löschen</button>
          </td>
        </tr>
      `).join('');
      journalCount.textContent = journalEntries.length;
      const total = journalEntries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
      journalTotal.textContent = `${total.toFixed(2)} h`;
      if (journalSumCell) journalSumCell.textContent = total.toFixed(2);
    }

    function setJournalStatus(text, isError = false) {
      if (!journalStatus) return;
      journalStatus.textContent = text;
      journalStatus.classList.toggle('error', isError);
    }

    function setJournalToday() {
      if (!journalDate) return;
      const today = new Date().toISOString().split('T')[0];
      journalDate.value = today;
    }

    /* ---------- Exporte ---------- */
    function toggleDownloadPanel(show) {
      if (!downloadPanel) return;
      const shouldShow = show ?? downloadPanel.classList.contains('hidden');
      downloadPanel.classList.toggle('hidden', !shouldShow);
    }

    function downloadFile(filename, mime, content) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function exportCSV(reduced = false) {
      const header = reduced
        ? ['Titel', 'Beschreibung', 'Datum', 'Stunden']
        : ['Titel', 'Beschreibung', 'Phase', 'Arbeitspaket', 'Stunden', 'Datum'];
      const rows = journalEntries.map(e => reduced
        ? [
            e.title,
            (e.description || '').replace(/"/g, '""'),
            e.date,
            e.hours
          ]
        : [
            e.title,
            (e.description || '').replace(/"/g, '""'),
            e.phase || '',
            e.packageName || '',
            e.hours,
            e.date
          ]);
      const lines = [header.join(';'), ...rows.map(r => r.map(v => `"${String(v ?? '')}"`).join(';'))];
      // prepend BOM for Excel UTF-8
      const bom = new Uint8Array([0xEF,0xBB,0xBF]);
      const csv = lines.join('\n');
      const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-${projectId || 'projekt'}${reduced ? '-reduced' : ''}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function exportPDF() {
      // Create a printable window that user can save as PDF
      const win = window.open('', '_blank', 'width=900,height=1200');
      if (!win) { setJournalStatus('Popup blockiert – bitte erlauben.', true); return; }
      const style = `
        <style>
          body { font-family: "Space Grotesk", Helvetica, sans-serif; padding: 20px; background:#0b1224; color:#e2e8f0; }
          h1 { margin-top:0; }
          table { width:100%; border-collapse:collapse; margin-top:12px; }
          th, td { border:1px solid #233041; padding:10px; font-size:13px; }
          th { background:#0ea5e9; color:#0b1224; }
          .chip { padding:3px 8px; border-radius:10px; background:#122033; color:#e2e8f0; border:1px solid #1f2c3f; }
        </style>`;
      const rows = journalEntries.map(e => `
        <tr>
          <td>${e.title}</td>
          <td>${e.description}</td>
          <td><span class="chip">${e.phase || ''}</span></td>
          <td>${e.packageName || ''}</td>
          <td>${e.hours}</td>
          <td>${e.date}</td>
        </tr>`).join('');
      const html = `
        <html><head>${style}</head><body>
          <h1>Arbeitsjournal Projekt ${projectId ?? ''}</h1>
          <div>Einträge: ${journalEntries.length} | Gesamtstunden: ${journalTotal?.textContent ?? ''}</div>
          <table>
            <thead>
              <tr><th>Kurz</th><th>Beschreibung</th><th>Phase</th><th>Arbeitspaket</th><th>Stunden</th><th>Datum</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };<\/script>
        </body></html>`;
      win.document.write(html);
      win.document.close();
    }

    function exportMarkdown() {
      const lines = [
        `# Arbeitsjournal Projekt ${projectId ?? ''}`,
        '',
        `Gesamt: ${journalTotal?.textContent ?? ''}`,
        ''
      ];
      lines.push('| Kurz | Beschreibung | Phase | Arbeitspaket | Stunden | Datum |');
      lines.push('| --- | --- | --- | --- | --- | --- |');
      journalEntries.forEach(e => {
        lines.push(`| ${e.title} | ${(e.description || '').replace(/\\n/g, ' ')} | ${e.phase || ''} | ${e.packageName || ''} | ${e.hours} | ${e.date} |`);
      });
      downloadFile(`journal-${projectId || 'projekt'}.md`, 'text/markdown;charset=utf-8', lines.join('\\n'));
    }

    function computeSchedule({ startDate, weekly, phases, packages }) {
      const weeklyMap = {
        1: weekly?.monday ?? 0,
        2: weekly?.tuesday ?? 0,
        3: weekly?.wednesday ?? 0,
        4: weekly?.thursday ?? 0,
        5: weekly?.friday ?? 0,
        6: weekly?.saturday ?? 0,
        0: weekly?.sunday ?? 0
      };
      const weeklyTotal = Object.values(weeklyMap).reduce((s, h) => s + (Number(h) || 0), 0);
      if (weeklyTotal <= 0) return { plan: [], totalHours: 0, days: 0 };

      const phaseOrder = phases.map(p => p.id);
      const sortPackages = (list) => {
        const copy = [...list];
        copy.sort((a, b) => {
          const ia = phaseOrder.indexOf(a.phaseId);
          const ib = phaseOrder.indexOf(b.phaseId);
          const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
          const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
          if (sa === sb) {
            const si = (a.sortIndex ?? Number.MAX_SAFE_INTEGER);
            const sj = (b.sortIndex ?? Number.MAX_SAFE_INTEGER);
            if (si !== sj) return si - sj;
            return (a.id ?? 0) - (b.id ?? 0);
          }
          return sa - sb;
        });
        return copy;
      };

      const spreadTasks = packages.filter(p => p.spread);
      const normalTasks = sortPackages(packages.filter(p => !p.spread));

      function scheduleSequential(list, capTemplate) {
        const plan = [];
        let current = new Date(startDate);
        const capMap = new Map(); // dateStr -> remaining hours
        const capKey = (d) => new Date(d).toDateString();
        const getCap = (d) => {
          const k = capKey(d);
          if (!capMap.has(k)) capMap.set(k, capTemplate[d.getDay()] ?? 0);
          return capMap.get(k);
        };
        const setCap = (d, val) => capMap.set(capKey(d), val);
        const moveToAvailableDay = (d) => {
          let day = new Date(d);
          while (getCap(day) <= 0) {
            day.setDate(day.getDate() + 1);
          }
          return day;
        };
        current = moveToAvailableDay(current);

        function scheduleBlock(totalHours) {
          let datePtr = new Date(current);
          let startAt = null;
          let remaining = totalHours;
          while (remaining > 0) {
            datePtr = moveToAvailableDay(datePtr);
            let cap = getCap(datePtr);
            if (cap <= 0) { datePtr.setDate(datePtr.getDate() + 1); continue; }
            if (!startAt) startAt = new Date(datePtr);
            const consume = Math.min(remaining, cap);
            cap -= consume;
            setCap(datePtr, cap);
            remaining -= consume;
            if (remaining > 0) {
              datePtr.setDate(datePtr.getDate() + 1);
            }
          }
          const endAt = new Date(datePtr);
          current = new Date(datePtr);
          return { startAt, endAt };
        }

        for (let i = 0; i < list.length; i++) {
          const pkg = list[i];
          if (pkg.parallel) {
            let groupHours = Number(pkg.time) || 0;
            const group = [pkg];
            let j = i + 1;
            while (j < list.length && list[j].parallel) {
              groupHours += Number(list[j].time) || 0;
              group.push(list[j]);
              j++;
            }
            const { startAt, endAt } = scheduleBlock(groupHours);
            for (const g of group) {
              plan.push({
                id: g.id,
                phaseId: g.phaseId,
                name: g.name,
                hours: g.time,
                status: g.status || 'ToDo',
                doneDate: g.doneDate,
                start: new Date(startAt),
                end: new Date(endAt),
                parallel: !!g.parallel,
                spread: !!g.spread
              });
            }
            i = j - 1;
            continue;
          }
          const { startAt, endAt } = scheduleBlock(Number(pkg.time) || 0);
          plan.push({
            id: pkg.id,
            phaseId: pkg.phaseId,
            name: pkg.name,
            hours: pkg.time,
            status: pkg.status || 'ToDo',
            doneDate: pkg.doneDate,
            start: startAt,
            end: endAt,
            parallel: !!pkg.parallel,
            spread: !!pkg.spread
          });
        }

        const maxEnd = plan.length ? new Date(Math.max(...plan.map(p => p.end))) : new Date(startDate);
        const distinctDays = new Set(plan.flatMap(p => [p.start.toDateString(), p.end.toDateString()])).size;
        const totalHours = plan.reduce((s, p) => s + (Number(p.hours) || 0), 0);
        return { plan, maxEnd, days: distinctDays, totalHours };
      }

      const spreadTotal = spreadTasks.reduce((s, p) => s + (Number(p.time) || 0), 0);
      const normalTotal = normalTasks.reduce((s, p) => s + (Number(p.time) || 0), 0);
      let weeksGuess = Math.max(1, Math.ceil((normalTotal || spreadTotal || 1) / weeklyTotal));

      let normalPlan = [];
      let finalWeeks = weeksGuess;
      for (let iter = 0; iter < 6; iter++) {
        const perWeekSpread = spreadTotal / weeksGuess;
        const adjustedWeekMap = {};
        Object.entries(weeklyMap).forEach(([day, cap]) => {
          const share = weeklyTotal ? (cap || 0) / weeklyTotal : 0;
          adjustedWeekMap[day] = Math.max(0, (cap || 0) - perWeekSpread * share);
        });
        const res = scheduleSequential(normalTasks, adjustedWeekMap);
        normalPlan = res.plan;
        const maxEnd = res.maxEnd || new Date(startDate);
        const startMonday = startOfWeek(new Date(startDate));
        const endMonday = startOfWeek(maxEnd);
        const diffMs = endMonday - startMonday;
        const weeksActual = Math.max(1, Math.round(diffMs / (7 * 86400000)) + 1);
        finalWeeks = weeksActual;
        if (weeksActual === weeksGuess) break;
        weeksGuess = weeksActual;
      }

      const spreadPlan = [];
      const projectStart = new Date(startDate);
      const findDayWithCap = (weekStart) => {
        let day = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
          const dow = day.getDay();
          if ((weeklyMap[dow] ?? 0) > 0) return new Date(day);
          day.setDate(day.getDate() + 1);
        }
        return new Date(weekStart);
      };

      spreadTasks.forEach(t => {
        const perWeek = (Number(t.time) || 0) / finalWeeks;
        if (perWeek <= 0) return;
        for (let w = 0; w < finalWeeks; w++) {
          const rawStart = new Date(projectStart.getTime() + w * 7 * 86400000);
          const weekStart = w === 0 ? projectStart : startOfWeek(rawStart);
          const day = findDayWithCap(weekStart < projectStart ? projectStart : weekStart);
          spreadPlan.push({
            id: t.id,
            phaseId: t.phaseId,
            name: t.name,
            hours: perWeek,
            status: t.status || 'ToDo',
            doneDate: t.doneDate,
            start: day,
            end: day,
            parallel: !!t.parallel,
            spread: true
          });
        }
      });

      const plan = [...normalPlan, ...spreadPlan].sort((a, b) => a.start - b.start || a.end - b.end);
      const totalHours = normalTotal + spreadTotal;
      const distinctDays = new Set(plan.flatMap(p => [p.start.toDateString(), p.end.toDateString()])).size;

      return { plan, totalHours, days: distinctDays };
    }

    function nextWorkDay(date, weeklyMap) {
      const d = new Date(date);
      const maxSearch = 365; // avoid infinite loop when no capacity
      let tries = 0;
      do {
        d.setDate(d.getDate() + 1);
        const hours = weeklyMap[d.getDay()] ?? 0;
        if (hours > 0) return { date: d, hoursLeftToday: hours };
        tries += 1;
      } while (tries < maxSearch);
      throw new Error('Keine verfuegbaren Kapazitaeten im Wochenplan.');
    }

    function filteredPlan() {
      const now = new Date();
      const todayStr = now.toISOString().slice(0,10);
      const monday = startOfWeek(now);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0);
      return planCache.filter(p => {
        if (filterMode === 'all') return true;
        const start = p.start.toISOString().slice(0,10);
        if (filterMode === 'today') return start === todayStr;
        if (filterMode === 'week') return p.start >= monday && p.start <= new Date(monday.getTime()+6*86400000);
        if (filterMode === 'month') return p.start >= monthStart && p.start <= monthEnd;
        return true;
      });
    }

    function aggregatedPlan() {
      const list = filteredPlan();
      const map = new Map();
      list.forEach(p => {
        if (!p.spread) { map.set(p.id, p); return; }
        const existing = map.get(p.id);
        if (!existing) {
          map.set(p.id, { ...p, __count: 1, startMin: p.start, endMax: p.end, totalHours: Number(p.hours) || 0 });
        } else {
          existing.totalHours = (Number(existing.totalHours) || 0) + (Number(p.hours) || 0);
          existing.__count += 1;
          if (p.start < existing.startMin) existing.startMin = p.start;
          if (p.end > existing.endMax) existing.endMax = p.end;
        }
      });
      return Array.from(map.values()).map(v => {
        if (!v.spread) return v;
        const perWeek = v.__count ? (v.totalHours / v.__count) : v.totalHours;
        return {
          id: v.id,
          phaseId: v.phaseId,
          name: v.name,
          status: v.status,
          doneDate: v.doneDate,
          parallel: v.parallel,
          spread: true,
          hours: v.totalHours,
          perWeek,
          start: v.startMin,
          end: v.endMax
        };
      });
    }

    // Drag & drop within phase (Phase view)
    phaseView.addEventListener('dragstart', (e) => {
      const row = e.target.closest('tr[data-id][draggable="true"]');
      if (!row) return;
      dragId = Number(row.dataset.id);
      dragPhase = row.dataset.phaseRow;
      e.dataTransfer.effectAllowed = 'move';
    });
    phaseView.addEventListener('dragover', (e) => {
      const row = e.target.closest('tr[data-id][draggable="true"]');
      if (!row || dragId === null) return;
      if (row.dataset.phaseRow !== dragPhase) return;
      e.preventDefault();
      row.classList.add('drag-over');
    });
    phaseView.addEventListener('dragleave', (e) => {
      const row = e.target.closest('tr[data-id][draggable="true"]');
      if (row) row.classList.remove('drag-over');
    });
    phaseView.addEventListener('drop', async (e) => {
      const targetRow = e.target.closest('tr[data-id][draggable="true"]');
      if (!targetRow || dragId === null) return;
      if (targetRow.dataset.phaseRow !== dragPhase) { dragId = null; dragPhase = null; return; }
      e.preventDefault();
      targetRow.classList.remove('drag-over');
      const rows = Array.from(phaseView.querySelectorAll(`tr[data-phase-row="${dragPhase}"]`));
      const orderedIds = rows.map(r => Number(r.dataset.id));
      const dragIndex = orderedIds.indexOf(dragId);
      const targetIndex = orderedIds.indexOf(Number(targetRow.dataset.id));
      if (dragIndex > -1 && targetIndex > -1 && dragIndex !== targetIndex) {
        orderedIds.splice(dragIndex,1);
        orderedIds.splice(targetIndex,0,dragId);
        await updatePhaseOrder(dragPhase === 'none' ? null : Number(dragPhase), orderedIds);
      }
      dragId = null;
      dragPhase = null;
    });

    // Task detail click handlers (Plan, Phase, Kanban)
    document.addEventListener('click', (e) => {
      const row = e.target.closest('.task-row');
      if (row && !e.target.closest('[data-edit],[data-delete],[data-action]')) {
        const id = Number(row.dataset.id || row.dataset.taskId);
        const pkg = packages.find(p => p.id === id);
        if (pkg) openDetailModal(pkg);
      }
      const kanbanCard = e.target.closest('.kanban-card');
      if (kanbanCard) {
        const id = Number(kanbanCard.dataset.id);
        const pkg = packages.find(p => p.id === id);
        if (pkg) openDetailModal(pkg);
      }
    });

    detailClose?.addEventListener('click', closeDetailModal);
    detailModal?.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
    detailModal?.addEventListener('wheel', (e) => {
      // prevent background scroll on overscroll
      const box = detailModal.querySelector('.modal-box');
      if (!box) return;
      const atTop = box.scrollTop === 0;
      const atBottom = Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight;
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    }, { passive: false });

    async function updatePhaseOrder(phaseId, orderedIds) {
      for (let i=0;i<orderedIds.length;i++){
        const id = orderedIds[i];
        const pkg = packages.find(p => p.id === id);
        if (!pkg) continue;
        if (pkg.sortIndex === i) continue;
        const res = await apiRequest(`/workPackages/${id}`, {
          method: 'PUT',
          body: { ...pkg, sortIndex: i }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        pkg.sortIndex = i;
      }
      await refreshPlan();
    }

    function renderPlan() {
      if (!startStr) {
        planCache = [];
        cardStart.textContent = '-';
        cardHours.textContent = '-';
        cardDays.textContent = '-';
        renderCurrentView();
        return;
      }
      const { plan, totalHours, days } = computeSchedule({ startDate: startStr, weekly, phases, packages });
      planCache = plan;

      cardStart.textContent = startStr ? new Date(startStr).toLocaleDateString('de-CH') : '-';
      cardHours.textContent = (totalHours || 0).toFixed(1) + ' h';
      cardDays.textContent = days || 0;
      const maxEnd = plan.length ? new Date(Math.max(...plan.map(p => p.end))) : null;
      document.getElementById('end-date').textContent = maxEnd ? maxEnd.toLocaleDateString('de-CH') : '-';
      const weeks = (() => {
        if (!plan.length) return null;
        const startMonday = startOfWeek(new Date(startStr));
        const endMonday = startOfWeek(maxEnd || new Date(startStr));
        const diffMs = endMonday - startMonday;
        const weeksCount = Math.max(1, Math.round(diffMs / (7*86400000)) + 1);
        return weeksCount;
      })();
      const avg = weeks ? (totalHours || 0) / weeks : 0;
      document.getElementById('week-avg').textContent = weeks ? `${avg.toFixed(1)} h` : '-';

      renderCurrentView();
    }

    function renderPhaseList() {
      if (!phases.length) {
        phaseRows.innerHTML = '<tr><td colspan="3">Keine Phasen.</td></tr>';
        return;
      }
      phaseRows.innerHTML = phases.map(p => `
        <div class="phase-row" data-phase-id="${p.id}" style="background:${(p.color || '#22d3ee')}18; border-color:${(p.color || '#22d3ee')}40;">
          <div class="phase-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 260px;">${p.name}</div>
          <div style="display:flex;gap:6px;justify-content:flex-end; flex-shrink:0;">
            <button class="icon-action" aria-label="Bearbeiten" data-edit-phase="${p.id}"><span class="material-symbols-rounded">edit</span></button>
            <button class="icon-action danger" aria-label="Loeschen" data-delete-phase="${p.id}"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>
      `).join('');
    }

    async function refreshPlan() {
      await loadStart();
      await loadWeekly();
      if (!weekly) setStatus('Kein Wochenplan hinterlegt, nutze 0h pro Tag.', true);
      await loadPhases();
      await loadPackages();
      renderPlan();
      renderKanbanPhaseOptions();
      renderKanbanBoard();
      const forecastActive = document.getElementById('top-forecast')?.classList.contains('active');
      if (forecastActive) renderForecast();
      setStatus('Zeitplan berechnet.');
    }

    async function init() {
      try {
        await loadProject();
        await refreshPlan();
        initJournal();
        const desiredView = params.get('view') || window.location.hash.replace('#', '');
        if (desiredView === 'journal') setTopView('journal');
        else if (desiredView === 'kanban') setTopView('kanban');
        else setTopView('dashboard');
      } catch (err) {
        setStatus(err.message, true);
        rows.innerHTML = '<tr><td colspan="7">Keine Daten.</td></tr>';
      }
    }

    rows.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-edit]');
      const delBtn = e.target.closest('[data-delete]');
      if (!btn && !delBtn) return;
      if (btn) {
        const id = Number(btn.dataset.edit);
        const pkg = packages.find(p => p.id === id);
        if (!pkg) return;
        openModal(pkg, 'edit');
      }
      if (delBtn) {
        const id = Number(delBtn.dataset.delete);
        deletePackage(id);
      }
    });

    phaseRows.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-edit-phase]');
      const delBtn = e.target.closest('[data-delete-phase]');
      if (!btn && !delBtn) {
        const row = e.target.closest('[data-phase-id]');
        if (!row) return;
        const id = Number(row.dataset.phaseId);
        loadPhaseIntoForm(id);
        return;
      }
      if (btn) {
        const id = Number(btn.dataset.editPhase);
        loadPhaseIntoForm(id);
      }
      if (delBtn) {
        const id = Number(delBtn.dataset.deletePhase);
        deletePhase(id);
      }
    });

    function loadPhaseIntoForm(id) {
          const phase = phases.find(p => p.id === id);
          if (!phase) return;
          phaseIdInput.value = phase.id;
          phaseNameInput.value = phase.name;
          phaseDescInput.value = phase.description || '';
          phaseColorInput.value = sanitizeColor(phase.color);
    }

    function setTab(tab) {
      [panelPhases, panelWeek, panelStart, panelTask].forEach(p => p.classList.add('hidden'));
      [tabPhases, tabWeek, tabStart, tabTask].forEach(b => b.classList.remove('active'));
      if (tab === 'start') {
        panelStart.classList.remove('hidden'); tabStart.classList.add('active');
      } else if (tab === 'week') {
        panelWeek.classList.remove('hidden'); tabWeek.classList.add('active');
      } else if (tab === 'phases') {
        panelPhases.classList.remove('hidden'); tabPhases.classList.add('active');
      } else if (tab === 'task') {
        panelTask.classList.remove('hidden'); tabTask.classList.add('active');
      }
    }

    tabPhases.addEventListener('click', () => setTab('phases'));
    tabWeek.addEventListener('click', () => setTab('week'));
    tabStart.addEventListener('click', () => setTab('start'));
    tabTask.addEventListener('click', () => setTab('task'));
    // ensure initial panel matches reordered buttons
    setTab('week');

    async function deletePackage(id) {
      const pkg = packages.find(p => p.id === id);
      if (!pkg) return;
      if (!window.confirm(`Arbeitspaket \"${pkg.name}\" Loeschen?`)) return;
      try {
        const res = await apiRequest(`/workPackages/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await refreshPlan();
        setStatus('Arbeitspaket geloescht.');
      } catch (err) {
        setStatus('Loeschen fehlgeschlagen (' + err.message + ').', true);
      }
    }

    async function deletePhase(id) {
      const phase = phases.find(p => p.id === id);
      if (!phase) return;
      if (!window.confirm(`Phase \"${phase.name}\" loeschen? Arbeitspakete werden nicht geloescht, aber ohne Phase.`)) return;
      try {
        // Delete phase
        const res = await apiRequest(`/phases/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        // Unassign work packages for this phase
        const wpRes = await apiRequest(`/workPackages?phaseId=${id}`);
        if (wpRes.ok) {
          const list = await wpRes.json();
          for (const wp of list) {
            await apiRequest(`/workPackages/${wp.id}`, {
              method: 'PUT',
              body: { ...wp, phaseId: null, projectId }
            });
          }
        }
        await refreshPlan();
        setStatus('Phase geloescht.');
      } catch (err) {
        setStatus('Loeschen fehlgeschlagen (' + err.message + ').', true);
      }
    }

    function openModal(pkg, mode = 'edit') {
      editingId = mode === 'edit' ? pkg.id : null;
      modalMode.textContent = mode === 'edit' ? 'Arbeitspaket bearbeiten' : 'Arbeitspaket erstellen';
      modalTitle.textContent = mode === 'edit' ? pkg.name : 'Neues Arbeitspaket';
      taskName.value = pkg?.name || '';
      taskDesc.value = pkg?.description || '';
      taskStatus.value = pkg?.status || 'ToDo';
      taskParallel.checked = !!pkg?.parallel;
      taskSpread.checked = !!pkg?.spread;
      taskTime.value = pkg?.time ?? 0;
      const selectedPhase = pkg?.phaseId ?? '';
      taskPhase.innerHTML = `<option value="">(keine Phase)</option>` + phases.map(p => `<option value="${p.id}" ${p.id === selectedPhase ? 'selected' : ''}>${p.name}</option>`).join('');
      modal.classList.remove('hidden');
    }

    function closeModal() {
      modal.classList.add('hidden');
      editingId = null;
    }

    function resolvePhaseName(pid) {
      if (pid === null || pid === undefined) return 'Ohne Phase';
      const ph = phases.find(p => p.id === pid);
      return ph ? ph.name : 'Ohne Phase';
    }

    function statusLabel(status) {
      return KANBAN_LABELS[status] || status || 'Backlog';
    }

    function openDetailModal(pkg) {
      if (!detailModal) return;
      detailTitle.textContent = pkg.name || 'Arbeitspaket';
      detailDesc.textContent = pkg.description || 'Keine Beschreibung';
      detailPhase.textContent = resolvePhaseName(pkg.phaseId);
      detailId.textContent = pkg.id ?? '-';
      detailParallel.textContent = pkg.parallel ? 'Ja' : 'Nein';
      detailSpread.textContent = pkg.spread ? 'Ja' : 'Nein';
      detailStatus.innerHTML = statusChip(pkg.status || 'ToDo');
      detailStatusPlain.textContent = statusLabel(pkg.status);
      detailHours.textContent = `${pkg.time ?? '-'} h`;
      const sched = planCache.find(p => p.id === pkg.id);
      detailStart.textContent = sched?.start ? sched.start.toLocaleDateString('de-CH') : '-';
      detailEnd.textContent = sched?.end ? sched.end.toLocaleDateString('de-CH') : '-';
      detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
      detailModal?.classList.add('hidden');
    }

    function renderPlanTable() {
      const resolvePhase = (pid) => {
        if (pid === null || pid === undefined) return 'Ohne Phase';
        const ph = phases.find(p => p.id === pid);
        return ph ? ph.name : 'Ohne Phase';
      };
      const list = aggregatedPlan();
      if (!list.length) {
        rows.innerHTML = '<tr><td colspan="7">Keine Arbeitspakete vorhanden.</td></tr>';
        return;
      }
      rows.innerHTML = list.map(p => {
        const warn = (p.phaseId === null || p.phaseId === undefined) ? `<span class="warn">!</span>` : '';
        const spread = p.spread ? `<span class="pill pill-ghost">Projektweit${p.perWeek ? ` (${p.perWeek.toFixed(1)} h/Woche)` : ''}</span>` : '';
        return `
        <tr class="task-row" data-task-id="${p.id}">
          <td>${resolvePhase(p.phaseId)}</td>
          <td>${p.name} ${warn} ${spread}</td>
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

    function renderPhaseGrouped() {
      const resolvePhase = (pid) => {
        if (pid === null || pid === undefined) return 'Ohne Phase';
        const ph = phases.find(p => p.id === pid);
        return ph ? ph.name : 'Ohne Phase';
      };
      const list = aggregatedPlan();
      if (!list.length) {
        phaseView.innerHTML = '<div class="muted">Keine Arbeitspakete vorhanden.</div>';
        return;
      }
      const groups = {};
      for (const p of list) {
        const key = p.phaseId ?? 'none';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      }
      const phaseName = (pid) => {
        if (pid === 'none') return 'Ohne Phase';
        return resolvePhase(Number(pid));
      };
      const order = Object.keys(groups).sort((a, b) => {
        const ia = phases.findIndex(p => p.id === (a === 'none' ? null : Number(a)));
        const ib = phases.findIndex(p => p.id === (b === 'none' ? null : Number(b)));
        const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
        const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
        return sa - sb;
      });
      phaseView.innerHTML = order.map(key => {
        const list = groups[key];
        const title = phaseName(key);
        const showWarn = key === 'none';
        const rowsHtml = list.map(p => `
          <tr draggable="true" class="task-row" data-phase-row="${p.phaseId ?? 'none'}" data-id="${p.id}">
            <td>${p.name} ${showWarn ? '<span class="warn">!</span>' : ''} ${p.spread ? `<span class=\"pill pill-ghost\">Projektweit${p.perWeek ? ` (${p.perWeek.toFixed(1)} h/Woche)` : ''}</span>` : ''}</td>
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

    /* ---------- Kanban ---------- */
    function renderKanbanPhaseOptions() {
      if (!kanbanPhaseSelect) return;
      // Auswahl merken, damit der Nutzer beim Reload/Drag nicht immer auf Phase 1 zurückfällt
      const previous = kanbanPhaseSelect.value;
      if (!phases.length) {
        kanbanPhaseSelect.innerHTML = '<option value="">(keine Phasen)</option>';
        return;
      }
      kanbanPhaseSelect.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      const found = phases.find(p => String(p.id) === previous);
      kanbanPhaseSelect.value = found ? previous : (phases[0]?.id ?? '');
    }

    function renderKanbanBoard() {
      if (!kanbanBoard || !kanbanPhaseSelect) return;
      const selectedPhase = Number(kanbanPhaseSelect.value || phases[0]?.id || 0);
      const list = packages.filter(p => !selectedPhase || p.phaseId === selectedPhase);
      kanbanBoard.innerHTML = KANBAN_STATUSES.map(status => {
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
      attachKanbanDnD();
    }

    function renderKanbanCard(item) {
      const color = KANBAN_COLOR[item.status] || '#94a3b8';
      const dot = `<span class="status-dot" style="background:${color};"></span>`;
      return `<div class="kanban-card" draggable="true" data-id="${item.id}" data-status="${item.status || 'Backlog'}">
        <h4>${dot}${item.name}</h4>
        ${item.description ? `<p>${item.description.slice(0, 120)}</p>` : ''}
      </div>`;
    }

    function attachKanbanDnD() {
      const cards = kanbanBoard.querySelectorAll('.kanban-card');
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
          kanbanBoard.querySelectorAll('.kanban-droptarget').forEach(c => c.classList.remove('kanban-droptarget'));
        });
      });
      kanbanBoard.querySelectorAll('.kanban-cards').forEach(col => {
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
          const cardEl = kanbanBoard.querySelector(`.kanban-card[data-id="${dragId}"]`);
          if (cardEl && cardEl.dataset.status !== targetStatus) {
            await updateKanbanStatus(dragId, targetStatus);
          }
          await refreshPlan();
        });
      });
    }

    async function updateKanbanStatus(id, status) {
      const pkg = packages.find(p => p.id === id);
      if (!pkg) return;
      const body = { ...pkg, status };
      const res = await apiRequest(`/workPackages/${id}`, {
        method: 'PUT',
        body
      });
      if (!res.ok) console.error('Update failed');
    }

    function renderCurrentView() {
      viewPlan.classList.add('hidden');
      viewPhase.classList.add('hidden');
      viewChart.classList.add('hidden');
      if (filterGroup) filterGroup.classList.add('hidden');
      fullscreenBtn.classList.add('hidden');
      if (currentView === 'plan') {
        viewPlan.classList.remove('hidden');
        renderPlanTable();
        if (filterGroup) filterGroup.classList.remove('hidden');
      } else if (currentView === 'phase') {
        viewPhase.classList.remove('hidden');
        renderPhaseGrouped();
        if (filterGroup) filterGroup.classList.remove('hidden');
      } else {
        viewChart.classList.remove('hidden');
        renderChart();
        fullscreenBtn.classList.remove('hidden');
      }
      viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentView);
      });
      renderHelp();
      syncHelpVisibility();
    }

    function renderForecast() {
      if (!forecastRows) return;
      const today = new Date();
      const todayStr = today.toISOString().slice(0,10);
      const openPackages = packages.filter(p => (p.status || 'ToDo') !== 'Finished');

      const setCards = ({ hoursText = '-', daysText = '-', endText = '-', weekText = '-' }) => {
        if (forecastCardStart) forecastCardStart.textContent = today.toLocaleDateString('de-CH');
        if (forecastCardHours) forecastCardHours.textContent = hoursText;
        if (forecastCardDays) forecastCardDays.textContent = daysText;
        if (forecastCardEnd) forecastCardEnd.textContent = endText;
        if (forecastCardWeek) forecastCardWeek.textContent = weekText;
      };

      if (!openPackages.length) {
        forecastRows.innerHTML = '<tr><td colspan="6">Alle Arbeitspakete sind bereits erledigt.</td></tr>';
        setCards({ hoursText: '0 h', daysText: '0', endText: '-', weekText: '-' });
        forecastStatus?.classList.remove('error');
        if (forecastStatus) forecastStatus.textContent = 'Keine offenen Arbeitspakete.';
        return;
      }

      const { plan, totalHours, days } = computeSchedule({
        startDate: todayStr,
        weekly,
        phases,
        packages: openPackages
      });

      const maxEnd = plan.length ? new Date(Math.max(...plan.map(p => p.end))) : null;
      const weeks = (() => {
        if (!plan.length) return null;
        const startMonday = startOfWeek(today);
        const endMonday = startOfWeek(maxEnd || today);
        const diffMs = endMonday - startMonday;
        return Math.max(1, Math.round(diffMs / (7 * 86400000)) + 1);
      })();
      const avg = weeks ? (totalHours || 0) / weeks : 0;

      setCards({
        hoursText: (totalHours || 0).toFixed(1) + ' h',
        daysText: days || 0,
        endText: maxEnd ? maxEnd.toLocaleDateString('de-CH') : '-',
        weekText: weeks ? `${avg.toFixed(1)} h` : '-'
      });

      const resolvePhase = (pid) => {
        if (pid === null || pid === undefined) return 'Ohne Phase';
        const ph = phases.find(p => p.id === pid);
        return ph ? ph.name : 'Ohne Phase';
      };

      if (!plan.length) {
        forecastRows.innerHTML = '<tr><td colspan="6">Keine Daten fuer Vorhersage.</td></tr>';
      } else {
        forecastRows.innerHTML = plan.map(p => {
          const warn = (p.phaseId === null || p.phaseId === undefined) ? `<span class="warn">!</span>` : '';
          return `
            <tr>
              <td>${resolvePhase(p.phaseId)}</td>
              <td>${p.name} ${warn}</td>
              <td>${statusChip(p.status || 'ToDo')}</td>
              <td>${p.hours}</td>
              <td>${fmt(p.start)}</td>
              <td>${fmt(p.end)}</td>
            </tr>
          `;
        }).join('');
      }

      forecastStatus?.classList.remove('error');
      if (forecastStatus) forecastStatus.textContent = 'Vorhersage aktualisiert.';
    }

    function chartLabelText(type) {
      if (type === 'health') return 'Projekt Status';
      if (type === 'gantt') return 'Gantt Diagramm';
      if (type === 'phasegantt') return 'Phasen Gantt';
      if (type === 'pie') return 'Kuchendiagramm';
      if (type === 'bar') return 'Balkendiagramm';
      if (type === 'burndown') return 'Burndown';
      return '';
    }

    function renderChart() {
      const currentType = chartTypes[chartIndex];
      if (currentType !== 'health' && !planCache.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Daten fuer Diagramm.</div>';
        chartLabel.textContent = chartLabelText(currentType);
        chartImageExportBtn?.classList.toggle('hidden', !isFullscreen);
        return;
      }
      chartLabel.textContent = chartLabelText(currentType);
      chartImageExportBtn?.classList.toggle('hidden', !isFullscreen);
      if (currentType === 'health') {
        chartZoomBtn.classList.add('hidden');
        renderHealth();
        return;
      }
      if (currentType === 'gantt') {
        chartZoomBtn.classList.toggle('hidden', !isFullscreen);
        renderGantt();
        return;
      }
      if (currentType === 'phasegantt') {
        chartZoomBtn.classList.toggle('hidden', !isFullscreen);
        renderPhaseGantt();
        return;
      }
      chartZoomBtn.classList.add('hidden');
      if (currentType === 'pie' || currentType === 'bar') {
        renderPieBar(currentType);
      } else if (currentType === 'burndown') {
        renderBurndown();
      }
    }

    function renderGantt() {
      if (!planCache.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Daten fuer Diagramm.</div>';
        return;
      }
      const minStart = new Date(Math.min(...planCache.map(p => p.start)));
      const maxEnd = new Date(Math.max(...planCache.map(p => p.end)));
      const days = [];
      for (let d = new Date(minStart); d <= maxEnd; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      // build weeks
      const weeks = [];
      let current = { ...isoWeek(days[0]), days: 0 };
      for (const day of days) {
        const w = isoWeek(day);
        if (w.week !== current.week || w.year !== current.year) {
          weeks.push(current);
          current = { ...w, days: 0 };
        }
        current.days += 1;
      }
      weeks.push(current);

      const totalDays = days.length;
      const dayWidth = 100 / totalDays;

      const weekHtml = weeks.map(w => `<div class="gantt-cell" style="width:${(w.days*dayWidth).toFixed(4)}%;">KW${String(w.week).padStart(2,'0')}</div>`).join('');
      const dayHtml = days.map(d => `<div class="gantt-cell" style="width:${dayWidth.toFixed(4)}%;"></div>`).join('');

      const phaseGroups = {};
      for (const p of planCache) {
        const key = p.phaseId ?? 'none';
        if (!phaseGroups[key]) phaseGroups[key] = [];
        phaseGroups[key].push(p);
      }
      const phaseName = (pid) => {
        if (pid === 'none') return 'Ohne Phase';
        const ph = phases.find(x => x.id === Number(pid));
        return ph ? ph.name : 'Ohne Phase';
      };
      const phaseColor = (pid) => {
        const ph = phases.find(x => x.id === Number(pid));
        return ph?.color || '#22d3ee';
      };
      const phaseOrder = Object.keys(phaseGroups).sort((a, b) => {
        const ia = phases.findIndex(p => p.id === (a === 'none' ? null : Number(a)));
        const ib = phases.findIndex(p => p.id === (b === 'none' ? null : Number(b)));
        const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
        const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
        return sa - sb;
      });

      const barScale = 1;
      const barsHtml = phaseOrder.map(pid => {
        const items = phaseGroups[pid];
        const color = pid === 'none' ? '#64748b' : phaseColor(pid);
        const rowBg = pid === 'none' ? 'rgba(255,255,255,0.01)' : `${color}22`;
        const barHeight = isZoomed ? 32 : 26;
        const barSpacing = isZoomed ? 44 : 32;
        const rowIndex = new Map();
        let rowCount = 0;
        const rowsForItems = items.map(t => {
          const key = t.spread ? `spread-${t.id}` : `task-${t.id}`;
          if (!rowIndex.has(key)) rowIndex.set(key, rowCount++);
          return rowIndex.get(key);
        });
        const barRows = items.map((t, idx) => {
          const startOffset = (t.start - minStart) / 86400000;
          const duration = ((t.end - t.start) / 86400000) + 1;
          const left = (startOffset / totalDays) * 100;
          const width = (duration / totalDays) * 100 * barScale;
          const row = rowsForItems[idx];
          return `<div class="gantt-bar small" style="left:${left}%;width:${width}%;background:${color};top:${row*barSpacing}px;height:${barHeight}px;">${t.name}</div>`;
        }).join('');
        const trackHeight = Math.max(barSpacing, rowCount * barSpacing + 12);
        return `
          <div class="gantt-row">
            <div class="gantt-label" style="background:${rowBg};">${phaseName(pid)}</div>
            <div class="gantt-track" style="height:${trackHeight}px; background:${rowBg};">
              <div class="gantt-grid" style="grid-template-columns: repeat(${totalDays}, ${dayWidth}%); position:absolute; inset:0; pointer-events:none;">${''}</div>
              ${barRows}
            </div>
          </div>
        `;
      }).join('');

      // Increase intrinsic chart width; cap only in fullscreen non-zoom to avoid scrollbar.
      const desiredBasePerDay = isZoomed
        ? (isFullscreen ? 620 : 520)
        : (isFullscreen ? 150 : 260);
      let basePerDay = desiredBasePerDay;
      if (isFullscreen && !isZoomed) {
        const available = (chartContainer?.clientWidth || window.innerWidth || 1200) - 24; // pad safety
        const fitPerDay = available / totalDays;
        basePerDay = Math.min(desiredBasePerDay, fitPerDay);
      }
      const minWidthPx = totalDays * basePerDay;

      chartContainer.innerHTML = `
        <div class="gantt" id="gantt-root" style="min-width:${minWidthPx}px;${isFullscreen && !isZoomed ? 'width:100%;' : ''}">
          <div class="gantt-head gantt-row" style="border-bottom:1px solid rgba(255,255,255,0.07);">
            <div class="gantt-label small">Wochen</div>
            <div class="gantt-track" style="padding:0; height:34px;">
              <div style="display:flex; height:100%;">${weekHtml}</div>
            </div>
          </div>
          <div class="gantt-head gantt-row" style="border-bottom:1px solid rgba(255,255,255,0.07);">
            <div class="gantt-label small">Tage</div>
            <div class="gantt-track" style="padding:0; height:34px;">
              <div style="display:flex; height:100%;">${dayHtml}</div>
            </div>
          </div>
          ${barsHtml}
        </div>
      `;
      const root = document.getElementById('gantt-root');
      if (isZoomed) root.classList.add('gantt-zoomed');
    }

    function renderPhaseGantt() {
      const list = filteredPlan().filter(p => p.phaseId !== undefined);
      if (!list.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Daten fuer Diagramm.</div>';
        return;
      }
      const minStart = new Date(Math.min(...list.map(p => p.start)));
      const maxEnd = new Date(Math.max(...list.map(p => p.end)));
      const days = [];
      for (let d = new Date(minStart); d <= maxEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));

      const weeks = [];
      let current = { ...isoWeek(days[0]), days: 0 };
      for (const day of days) {
        const w = isoWeek(day);
        if (w.week !== current.week || w.year !== current.year) {
          weeks.push(current);
          current = { ...w, days: 0 };
        }
        current.days += 1;
      }
      weeks.push(current);

      const totalDays = days.length;
      const dayWidth = 100 / totalDays;
      const weekHtml = weeks.map(w => `<div class="gantt-cell" style="width:${(w.days*dayWidth).toFixed(4)}%;">KW${String(w.week).padStart(2,'0')}</div>`).join('');
      const dayHtml = days.map(() => `<div class="gantt-cell" style="width:${dayWidth.toFixed(4)}%;"></div>`).join('');

      const spanByPhase = {};
      for (const p of list) {
        const pid = p.phaseId ?? 'none';
        if (pid === 'none') continue; // nur echte Phasen darstellen
        const start = p.start;
        const end = p.end;
        if (!spanByPhase[pid]) {
          spanByPhase[pid] = { start, end };
        } else {
          if (start < spanByPhase[pid].start) spanByPhase[pid].start = start;
          if (end > spanByPhase[pid].end) spanByPhase[pid].end = end;
        }
      }

      const phaseKeys = Object.keys(spanByPhase);
      if (!phaseKeys.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Phasen mit Arbeitspaketen vorhanden.</div>';
        return;
      }

      const phaseOrder = phaseKeys.sort((a, b) => {
        const ia = phases.findIndex(p => p.id === (a === 'none' ? null : Number(a)));
        const ib = phases.findIndex(p => p.id === (b === 'none' ? null : Number(b)));
        const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
        const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
        return sa - sb;
      });

      const barScale = 1;
      const barsHtml = phaseOrder.map(pid => {
        const span = spanByPhase[pid];
        const startOffset = (span.start - minStart) / 86400000;
        const duration = ((span.end - span.start) / 86400000) + 1;
        const left = (startOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100 * barScale;
        const ph = pid === 'none' ? null : phases.find(p => p.id === Number(pid));
        const color = ph?.color || '#64748b';
        const label = ph?.name || 'Ohne Phase';
        const rowBg = pid === 'none' ? 'rgba(255,255,255,0.02)' : `${color}20`;
        const barHeight = isZoomed ? 30 : 26;
        const trackHeight = barHeight + 12;
        return `
          <div class="gantt-row">
            <div class="gantt-label" style="background:${rowBg};">${label}</div>
            <div class="gantt-track" style="height:${trackHeight}px; background:${rowBg};">
              <div class="gantt-grid" style="grid-template-columns: repeat(${totalDays}, ${dayWidth}%); position:absolute; inset:0; pointer-events:none;"></div>
              <div class="gantt-bar small" style="left:${left}%;width:${width}%;background:${color};top:8px;height:${barHeight}px;">${label}</div>
            </div>
          </div>
        `;
      }).join('');

      // Match wider timeline sizing with task Gantt; cap only in fullscreen non-zoom
      const desiredBasePerDay = isZoomed
        ? (isFullscreen ? 620 : 520)
        : (isFullscreen ? 150 : 260);
      let basePerDay = desiredBasePerDay;
      if (isFullscreen && !isZoomed) {
        const available = (chartContainer?.clientWidth || window.innerWidth || 1200) - 24;
        const fitPerDay = available / totalDays;
        basePerDay = Math.min(desiredBasePerDay, fitPerDay);
      }
      const minWidthPx = totalDays * basePerDay;
      chartContainer.innerHTML = `
        <div class="gantt" id="gantt-root" style="min-width:${minWidthPx}px;${isFullscreen && !isZoomed ? 'width:100%;' : ''}">
          <div class="gantt-head gantt-row" style="border-bottom:1px solid rgba(255,255,255,0.07);">
            <div class="gantt-label small">Wochen</div>
            <div class="gantt-track" style="padding:0; height:34px;">
              <div style="display:flex; height:100%;">${weekHtml}</div>
            </div>
          </div>
          <div class="gantt-head gantt-row" style="border-bottom:1px solid rgba(255,255,255,0.07);">
            <div class="gantt-label small">Tage</div>
            <div class="gantt-track" style="padding:0; height:34px;">
              <div style="display:flex; height:100%;">${dayHtml}</div>
            </div>
          </div>
          ${barsHtml}
        </div>
      `;
      const root = document.getElementById('gantt-root');
      if (isZoomed) root.classList.add('gantt-zoomed');
    }

    function renderPieBar(type) {
      // aggregate hours by phase
      const totals = {};
      let totalHours = 0;
      for (const p of filteredPlan()) {
        const key = p.phaseId ?? 'none';
        totals[key] = (totals[key] || 0) + (Number(p.hours) || 0);
        totalHours += Number(p.hours) || 0;
      }
      if (!totalHours) {
        chartContainer.innerHTML = '<div class="muted">Keine Stunden vorhanden.</div>';
        return;
      }
      const items = Object.entries(totals).map(([pid, val]) => {
        const ph = pid === 'none' ? null : phases.find(x => x.id === Number(pid));
        return {
          id: pid,
          label: ph ? ph.name : 'Ohne Phase',
          value: val,
          color: ph?.color || '#6b7280'
        };
      });

      if (type === 'pie') {
        const gradient = items.map((it, i) => {
          const start = items.slice(0, i).reduce((s, x) => s + x.value, 0) / totalHours * 100;
          const end = start + (it.value / totalHours * 100);
          return `${it.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
        }).join(', ');
        const legend = items.map(it => `
          <div class="legend-row">
            <span class="legend-swatch" style="background:${it.color};"></span>
            <span>${it.label}</span>
            <span class="muted" style="margin-left:auto;">${it.value.toFixed(1)}h</span>
          </div>
        `).join('');
        chartContainer.innerHTML = `
          <div class="chart-box">
            <div class="chart-visual"><div class="pie" style="background: conic-gradient(${gradient});"></div></div>
            <div class="legend">${legend}</div>
          </div>
        `;
        // html2canvas rendert conic-gradient nicht zuverlässig; bei PDF-Export auf Canvas-Snapshot ausweichen
        if (document.documentElement.dataset.export === 'pdf') {
          const pieEl = chartContainer.querySelector('.pie');
          if (pieEl) {
            const size = (pieEl.offsetWidth || 220) * 2; // höhere Auflösung fürs PDF
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            let angle = -Math.PI / 2;
            items.forEach(it => {
              const slice = (it.value / totalHours) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(size/2, size/2);
              ctx.fillStyle = it.color;
              ctx.arc(size/2, size/2, size/2 - 6, angle, angle + slice);
              ctx.closePath();
              ctx.fill();
              angle += slice;
            });
            ctx.strokeStyle = 'rgba(15,23,42,0.10)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
            ctx.stroke();
            const dataUrl = canvas.toDataURL('image/png');
            pieEl.style.background = `url(${dataUrl}) center/contain no-repeat`;
          }
        }
      } else if (type === 'bar') {
        const max = Math.max(...items.map(i => i.value));
        const bars = items.map(it => `
          <div class="bar-row">
            <span style="white-space: nowrap;">${it.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(it.value / max * 100).toFixed(1)}%; background:${it.color};"></div>
            </div>
            <span class="muted" style="text-align:right;">${it.value.toFixed(1)}h</span>
          </div>
        `).join('');
        chartContainer.innerHTML = `
          <div class="bar-wrap">
            ${bars}
          </div>
        `;
      }
    }

    function renderBurndown() {
      const list = filteredPlan();
      if (!list.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Daten fuer Diagramm.</div>';
        return;
      }
      // collect days from start to last end
      const minStart = new Date(Math.min(...list.map(p => p.start)));
      const maxEnd = new Date(Math.max(...list.map(p => p.end)));
      const days = [];
      for (let d = new Date(minStart); d <= maxEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));
      if (!days.length) {
        chartContainer.innerHTML = '<div class="muted">Keine Daten fuer Diagramm.</div>';
        return;
      }

      const total = list.reduce((s, p) => s + (Number(p.hours) || 0), 0);

      // ideal line: subtract daily capacity
      let idealRem = total;
      const ideal = [];
      for (const d of days) {
        idealRem = Math.max(0, idealRem - (weekly?.[['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()]] ?? 0));
        ideal.push({ d: new Date(d), v: idealRem });
      }

      // actual: subtract hours of finished tasks by doneDate, else count when end date passes
      let actualRem = total;
      const actual = [];
      for (const d of days) {
        const dayStr = d.toISOString().slice(0,10);
        const completed = planCache
          .filter(p => p.status === 'Finished' && (
            (p.doneDate && p.doneDate.slice(0,10) <= dayStr) ||
            (!p.doneDate && p.end <= d) // fallback: treat without doneDate as erledigt zum Enddatum
          ))
          .reduce((s,p)=> s + (Number(p.hours)||0), 0);
        actualRem = Math.max(0, total - completed);
        actual.push({ d: new Date(d), v: actualRem });
      }

      const maxY = Math.max(total, ...ideal.map(i=>i.v), ...actual.map(a=>a.v)) || 1;
      const width = 1000;
      const height = 260;
      const xStep = days.length > 1 ? width / (days.length -1) : width;
      const scaleY = (v) => height - (v / maxY) * height;
      const toPoints = (arr) => arr.length ? arr.map((p,i)=> `${i*xStep},${scaleY(p.v)}`).join(' ') : `0,${height}`;

      const idealPoints = toPoints(ideal);
      const actualPoints = toPoints(actual);

      const xLabels = days.map((d,i)=> i%7===0 ? `<text x="${i*xStep}" y="${height+20}" fill="#94a3b8" font-size="12">${d.toLocaleDateString('de-CH')}</text>` : '').join('');

      chartContainer.innerHTML = `
        <svg width="100%" viewBox="0 0 ${width} ${height+30}" preserveAspectRatio="xMinYMin slice">
          <polyline points="${idealPoints}" fill="none" stroke="${varAccent()}" stroke-width="2" stroke-dasharray="6 4" />
          <polyline points="${actualPoints}" fill="none" stroke="#f97316" stroke-width="3" />
          ${xLabels}
        </svg>
        <div class="line-legend">
          <span><span class="line-chip" style="background:${varAccent()};"></span>Ideal</span>
          <span><span class="line-chip" style="background:#f97316;"></span>Ist</span>
        </div>
      `;
    }

    function renderHealth() {
      const today = new Date();
      const todayStr = today.toISOString().slice(0,10);

      const totalPlanned = packages.reduce((s,p)=> s + (Number(p.time)||0), 0);

      // Same basis wie Burndown: actual = fertig, ideal = Kapazitätstage
      const completedPlannedHours = planCache
        .filter(p => (p.status || 'Backlog') === 'Finished' && (
          (p.doneDate && p.doneDate.slice(0,10) <= todayStr) ||
          (!p.doneDate && p.end <= today)
        ))
        .reduce((s,p)=> s + (Number(p.hours)||0), 0);

      // Ideal verbleibend heute basierend auf Wochenkapazität
      let idealRemaining = totalPlanned;
      if (weekly && planCache.length) {
        const minStart = new Date(Math.min(...planCache.map(p => p.start)));
        for (let d = new Date(minStart); d <= today; d.setDate(d.getDate() + 1)) {
          const cap = weekly?.[['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()]] ?? 0;
          idealRemaining = Math.max(0, idealRemaining - cap);
        }
      }
      const actualRemaining = Math.max(0, totalPlanned - completedPlannedHours);
      const onPlan = actualRemaining <= idealRemaining + 0.001;

      const remainingPlanned = packages
        .filter(p => (p.status || 'Backlog') !== 'Finished')
        .reduce((s,p)=> s + (Number(p.time)||0), 0);

      const journalTotalHours = journalEntries
        .reduce((s,e)=> s + (Number(e.hours)||0), 0);

      let forecastEnd = '-';
      if (weekly) {
        const openPackages = packages.filter(p => (p.status || 'Backlog') !== 'Finished');
        if (openPackages.length) {
          const { plan } = computeSchedule({ startDate: todayStr, weekly, phases, packages: openPackages });
          if (plan.length) {
            const maxEnd = new Date(Math.max(...plan.map(p => p.end)));
            forecastEnd = maxEnd.toLocaleDateString('de-CH');
          }
        }
      }

      const items = [
        {
          label: 'Bin ich im Plan?',
          value: onPlan ? 'Ja' : 'Nein',
          tone: onPlan ? 'ok' : 'warn'
        },
        {
          label: 'Verbleibende geplante Stunden',
          value: `${remainingPlanned.toFixed(1)} h`,
          tone: 'neutral'
        },
        {
          label: 'Abgeschlossen',
          value: `${journalTotalHours.toFixed(1)} h`,
          tone: 'neutral'
        },
        {
          label: 'Forecast Projektende',
          value: forecastEnd,
          tone: 'neutral'
        }
      ];

      chartContainer.innerHTML = `
        <div class="health-grid">
          ${items.map(it => `
            <div class="health-row">
              <div class="health-label">${it.label}</div>
              <div class="health-value ${it.tone}">${it.value}</div>
            </div>
          `).join('')}
        </div>
        <div class="muted" style="margin-top:10px;font-size:13px;">Ist/Plan basiert auf Plan-Berechnung und Arbeitsjournal; Forecast nutzt offene Pakete ab heute.</div>
      `;
    }
    function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function exportChartAsPng() {
  if (!planCache.length) {
    setStatus('Keine Diagrammdaten vorhanden.', true);
    return;
  }
  if (!document.body.classList.contains('fullscreen-chart')) {
    setStatus('Bitte zuerst Fullscreen aktivieren.', true);
    return;
  }
  if (typeof window.html2canvas === 'undefined') {
    setStatus('Export fehlgeschlagen: html2canvas nicht geladen.', true);
    return;
  }

  const target = document.querySelector('body.fullscreen-chart .shell') || chartContainer;
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename = `export-all-${ts}.pdf`;

  const prevScrollLeft = target.scrollLeft;
  const prevScrollTop = target.scrollTop;
  target.scrollLeft = 0;
  target.scrollTop = 0;

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    document.documentElement.setAttribute('data-export', 'pdf');
    await document.fonts?.ready;

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('jsPDF nicht geladen');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const headerGap = 22;
    const subheaderGap = 14;
    const footerGap = 18;
    const titleY = margin + 8;
    const subtitleY = titleY + headerGap;
    const yStart = subtitleY + subheaderGap;
    const footerY = pageHeight - margin + 4;
    const maxW = pageWidth - margin * 2;
    const maxH = footerY - yStart - footerGap;
    const projectTitle = title?.textContent || 'Projekt';

    // Preload logo for title page
    let logoData = null;
    try {
      const res = await fetch('assets/logo/logo.png');
      if (res.ok) {
        const blob = await res.blob();
        logoData = await blobToDataUrl(blob);
      }
    } catch (e) { /* logo optional */ }

    // Title page (clean cover)
    pdf.setFillColor(241, 245, 255); // soft background
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // subtle accent band
    pdf.setFillColor(225, 234, 255);
    pdf.rect(0, pageHeight * 0.18, pageWidth, pageHeight * 0.12, 'F');

    // cover card
    const cardW = Math.min(620, pageWidth - margin * 2);
    const cardH = 260;
    const cardX = (pageWidth - cardW) / 2;
    const cardY = (pageHeight - cardH) / 2;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(215, 223, 245);
    pdf.roundedRect(cardX, cardY, cardW, cardH, 14, 14, 'FD');

    // logo
    if (logoData) {
      const img = new Image();
      img.src = logoData;
      await new Promise((res) => { img.onload = res; });
      const maxLogoW = 220;
      const maxLogoH = 120;
      const ratio = Math.min(maxLogoW / img.width, maxLogoH / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = cardX + (cardW - w) / 2;
      const y = cardY + 28;
      pdf.addImage(logoData, 'PNG', x, y, w, h, undefined, 'FAST');
    }

    // project name
    pdf.setTextColor(28, 37, 64);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text(projectTitle, pageWidth / 2, cardY + cardH - 82, { align: 'center' });

    // subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(76, 86, 106);
    pdf.text('Projektbericht', pageWidth / 2, cardY + cardH - 56, { align: 'center' });

    // date
    pdf.setTextColor(104, 112, 125);
    pdf.text(new Date().toLocaleDateString('de-CH'), pageWidth / 2, cardY + cardH - 32, { align: 'center' });

    // Charts start on next page
    pdf.addPage('a4', 'landscape');

    const originalIndex = chartIndex;
    for (let i = 0; i < chartTypes.length; i++) {
      chartIndex = i;
      renderChart();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      document.body.classList.add('capturing');
      const canvas = await window.html2canvas(target, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      });
      document.body.classList.remove('capturing');

      const imgData = canvas.toDataURL('image/png');
      const img = new Image();
      const waitImg = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgData;
      });
      await waitImg;

      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (pageWidth - w) / 2;
      const y = yStart + (maxH - h) / 2;

      if (i > 0) pdf.addPage('a4', 'landscape');

      // Background
      pdf.setFillColor(233, 242, 255); // helle Blau-Weiss Mischung
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Title & subtitle
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(projectTitle, margin, titleY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(chartLabelText(chartTypes[i]) || '', margin, subtitleY);

      // Image
      pdf.addImage(imgData, 'PNG', x, y, w, h, undefined, 'FAST');

      // Footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Generated by ProjectPlanner by Patrick Schöpfer', pageWidth / 2, footerY, { align: 'center' });
    }

    chartIndex = originalIndex;
    renderChart();

    pdf.save(filename);
    setStatus('PDF exportiert: ' + filename);
  } catch (err) {
    setStatus('Export fehlgeschlagen: ' + (err?.message || err), true);
  } finally {
    document.documentElement.removeAttribute('data-export');
    document.body.classList.remove('capturing');
    target.scrollLeft = prevScrollLeft;
    target.scrollTop = prevScrollTop;
  }
}


    function varAccent() { return getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#22d3ee'; }

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    taskForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const payload = {
        projectId,
        phaseId: taskPhase.value ? Number(taskPhase.value) : null,
        name: taskName.value.trim(),
        description: taskDesc.value.trim(),
        time: Number(taskTime.value),
        status: taskStatus.value || 'Backlog',
        parallel: taskParallel.checked,
        spread: taskSpread.checked
      };
      if (!payload.name) {
        setStatus('Name darf nicht leer sein.', true);
        return;
      }
      if (Number.isNaN(payload.time)) {
        setStatus('Bitte gueltige Stunden angeben.', true);
        return;
      }
      try {
        if (editingId) {
          const existing = packages.find(p => p.id === editingId);
          let doneDate = existing?.doneDate || null;
          if (payload.status === 'Finished') {
            doneDate = doneDate || new Date().toISOString();
          } else {
            doneDate = null;
          }
          const res = await apiRequest(`/workPackages/${editingId}`, {
            method: 'PUT',
            body: { id: editingId, ...payload, doneDate }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          const doneDate = payload.status === 'Finished' ? new Date().toISOString() : null;
          const res = await apiRequest('/workPackages', {
            method: 'POST',
            body: { ...payload, doneDate }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        closeModal();
        await refreshPlan();
      } catch (err) {
        setStatus('Speichern fehlgeschlagen (' + err.message + ').', true);
      }
    });

    reloadBtn.addEventListener('click', async () => {
      setStatus('Neu berechnen...');
      await refreshPlan();
      setStatus('Zeitplan neu berechnet.');
    });

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setTopView('dashboard');
        currentView = btn.dataset.view;
        renderCurrentView();
      });
    });

    let isFullscreen = false;
    let dragId = null;
    let dragPhase = null;
    chartPrev.addEventListener('click', () => {
      chartIndex = (chartIndex - 1 + chartTypes.length) % chartTypes.length;
      renderChart();
    });
    chartNext.addEventListener('click', () => {
      chartIndex = (chartIndex + 1) % chartTypes.length;
      renderChart();
    });
    chartZoomBtn.addEventListener('click', () => {
      isZoomed = !isZoomed;
      chartZoomBtn.textContent = isZoomed ? 'Kleine Sicht anzeigen' : 'Volle Groesse anzeigen';
      document.body.classList.toggle('fullscreen-chart-zoomed', isFullscreen && isZoomed);
      renderChart();
      if (isFullscreen) {
        chartContainer.scrollLeft = 0;
      }
    });

    chartImageExportBtn?.addEventListener('click', exportChartAsPng);


    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterMode = btn.dataset.filter;
        filterButtons.forEach(b => b.classList.toggle('active', b === btn));
        renderPlan();
      });
    });

    const fsClose = document.createElement('button');
    fsClose.className = 'fullscreen-close hidden';
    fsClose.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8m0-8L2 10" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>';
    document.body.appendChild(fsClose);
    fsClose.addEventListener('click', () => {
      isFullscreen = false;
      isZoomed = false;
      chartView.classList.remove('gantt-fullscreen');
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('fullscreen-chart');
      document.body.classList.remove('fullscreen-chart-zoomed');
      fsClose.classList.add('hidden');
      chartZoomBtn.classList.add('hidden');
      chartZoomBtn.textContent = 'Volle Groesse anzeigen';
      fullscreenBtn.textContent = 'Fullscreen';
      renderChart();
    });

    fullscreenBtn.addEventListener('click', () => {
      isFullscreen = !isFullscreen;
      if (!isFullscreen) isZoomed = false;
      chartView.classList.toggle('gantt-fullscreen', isFullscreen);
      document.documentElement.classList.toggle('no-scroll', isFullscreen);
      document.body.classList.toggle('fullscreen-chart', isFullscreen);
      document.body.classList.toggle('fullscreen-chart-zoomed', isFullscreen && isZoomed);
      fullscreenBtn.textContent = isFullscreen ? 'Schliessen' : 'Fullscreen';
      fsClose.classList.toggle('hidden', !isFullscreen);
      if (!isFullscreen) chartZoomBtn.textContent = 'Volle Groesse anzeigen';
      chartZoomBtn.classList.toggle('hidden', !isFullscreen || (chartTypes[chartIndex] !== 'gantt' && chartTypes[chartIndex] !== 'phasegantt'));
      if (currentView !== 'chart') currentView = 'chart';
      renderCurrentView();
      if (isFullscreen) {
        chartContainer.scrollIntoView({ block: 'start' });
      }
    });

    phaseForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const payload = {
        name: phaseNameInput.value.trim(),
        description: phaseDescInput.value.trim(),
        color: sanitizeColor(phaseColorInput.value),
        projectId
      };
      if (!payload.name) {
        setStatus('Phasenname darf nicht leer sein.', true);
        return;
      }
      try {
        if (phaseIdInput.value) {
          const id = Number(phaseIdInput.value);
          const res = await apiRequest(`/phases/${id}`, {
            method: 'PUT',
            body: { id, ...payload }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          const res = await apiRequest('/phases', {
            method: 'POST',
            body: payload
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        phaseForm.reset();
        phaseIdInput.value = '';
        await refreshPlan();
      } catch (err) {
        setStatus('Phase konnte nicht gespeichert werden (' + err.message + ').', true);
      }
      phaseColorInput.value = '#22d3ee';
    });

    function sanitizeColor(val) {
      const hex = (val || '').trim();
      if (/^#([0-9a-fA-F]{6})$/.test(hex)) return hex;
      return '#22d3ee';
    }

    document.getElementById('week-form').addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const payload = { projectId };
      for (const [key, input] of Object.entries(weekInputs)) {
        const val = Number(input.value || 0);
        payload[key] = Number.isNaN(val) ? 0 : val;
      }
      try {
        const check = await apiRequest(`/weeklyPlans?projectId=${projectId}`);
        const existing = check.ok ? await check.json() : [];
        if (existing.length) {
          const id = existing[0].id;
          const res = await apiRequest(`/weeklyPlans/${id}`, {
            method: 'PUT',
            body: { id, ...payload }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          const res = await apiRequest('/weeklyPlans', {
            method: 'POST',
            body: payload
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        await refreshPlan();
      } catch (err) {
        setStatus('Wochentage konnten nicht gespeichert werden (' + err.message + ').', true);
      }
    });

    document.getElementById('start-form').addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const startDate = startDateInput.value;
      const durationHours = Number(durationHoursInput.value || 0);
      if (!hasWeeklyCapacity()) {
        setStatus('Bitte zuerst Wochenzeiten eintragen.', true);
        setTab('week');
        weekInputs.monday?.focus();
        return;
      }
      if (!startDate) {
        setStatus('Bitte Startdatum waehlen.', true);
        return;
      }
      try {
        const check = await apiRequest(`/projectStarts?projectId=${projectId}`);
        const existing = check.ok ? await check.json() : [];
        if (existing.length) {
          const id = existing[0].id;
          const res = await apiRequest(`/projectStarts/${id}`, {
            method: 'PUT',
            body: { id, projectId, startDate, durationHours }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          const res = await apiRequest('/projectStarts', {
            method: 'POST',
            body: { projectId, startDate, durationHours }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        await refreshPlan();
      } catch (err) {
        setStatus('Startdatum konnte nicht gespeichert werden (' + err.message + ').', true);
      }
    });

    journalForm?.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const title = document.getElementById('journal-title').value.trim();
      const description = document.getElementById('journal-description').value.trim();
      const phase = journalPhaseSelect?.value || '';
      const packageId = journalPackageSelect?.value || '';
      const packageName = packageId ? (packages.find(p => String(p.id) === packageId)?.name || '-') : '';
      const hours = Number(document.getElementById('journal-hours').value);
      const date = journalDate?.value || new Date().toISOString().split('T')[0];

      if (!title || !description) {
        setJournalStatus('Bitte Titel und Beschreibung ausfüllen.', true);
        return;
      }
      if (Number.isNaN(hours)) {
        setJournalStatus('Bitte eine Stundenanzahl angeben.', true);
        return;
      }

      const entry = { title, description, phase, packageId, packageName, hours: hours.toFixed(2), date };
      if (journalEditIndex !== null) {
        journalEntries[journalEditIndex] = entry;
        setJournalStatus('Eintrag aktualisiert.');
      } else {
        journalEntries.unshift(entry);
        setJournalStatus('Eintrag gespeichert.');
      }
      persistJournal();
      renderJournal();
      resetJournalForm();
    });

    journalRows?.addEventListener('click', (evt) => {
      const btn = evt.target.closest('[data-remove]');
      const editBtn = evt.target.closest('[data-edit-journal]');
      if (btn) {
        const index = Number(btn.dataset.remove);
        journalEntries.splice(index, 1);
        persistJournal();
        renderJournal();
        setJournalStatus('Eintrag gelöscht.');
        if (journalEditIndex === index) resetJournalForm();
        return;
      }
      if (editBtn) {
        const index = Number(editBtn.dataset.editJournal);
        startJournalEdit(index);
      }
    });

    function initJournal() {
      setJournalToday();
      renderJournalPhaseOptions();
      loadJournal();
    }

    function startJournalEdit(index) {
      const entry = journalEntries[index];
      if (!entry) return;
      journalEditIndex = index;
      document.getElementById('journal-title').value = entry.title;
      document.getElementById('journal-description').value = entry.description;
      if (journalPhaseSelect) journalPhaseSelect.value = entry.phase || '';
      if (journalPackageSelect) journalPackageSelect.value = entry.packageId || '';
      document.getElementById('journal-hours').value = entry.hours;
      if (journalDate) journalDate.value = entry.date;
      if (journalSubmitBtn) journalSubmitBtn.textContent = 'Änderungen speichern';
      if (journalCancelBtn) journalCancelBtn.style.display = 'inline-block';
      setJournalStatus('Bearbeitung aktiviert.');
    }

    function resetJournalForm() {
      journalEditIndex = null;
      journalForm.reset();
      setJournalToday();
      if (journalSubmitBtn) journalSubmitBtn.textContent = 'Eintrag speichern';
      if (journalCancelBtn) journalCancelBtn.style.display = 'none';
    }

    journalCancelBtn?.addEventListener('click', resetJournalForm);

    downloadToggle?.addEventListener('click', () => toggleDownloadPanel());
    document.addEventListener('click', (e) => {
      if (!downloadPanel || !downloadToggle) return;
      if (downloadPanel.contains(e.target) || downloadToggle.contains(e.target)) return;
      toggleDownloadPanel(false);
    });
    downloadPanel?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-export]');
      if (!btn) return;
      const type = btn.dataset.export;
      toggleDownloadPanel(false);
      if (!journalEntries.length) { setJournalStatus('Keine Einträge zum Export.', true); return; }
      if (type === 'csv') exportCSV(false);
      else if (type === 'csv-lite') exportCSV(true);
      else if (type === 'md') exportMarkdown();
      else if (type === 'pdf') exportPDF();
    });

    document.getElementById('nav-kanban')?.addEventListener('click', () => setTopView('kanban'));
    kanbanPhaseSelect?.addEventListener('change', renderKanbanBoard);
    kanbanReload?.addEventListener('click', refreshPlan);

    inlineTaskForm?.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const payload = {
        projectId,
        phaseId: inlineTaskPhase.value ? Number(inlineTaskPhase.value) : null,
        name: inlineTaskName.value.trim(),
        description: inlineTaskDesc.value.trim(),
        status: inlineTaskStatus.value || 'Backlog',
        parallel: inlineTaskParallel.checked,
        spread: inlineTaskSpread.checked,
        time: Number(inlineTaskTime.value)
      };
      if (!payload.name) { setStatus('Bitte Aufgabennamen angeben.', true); return; }
      if (Number.isNaN(payload.time)) { setStatus('Bitte Stunden angeben.', true); return; }
      try {
        const res = await apiRequest('/workPackages', {
          method: 'POST',
          body: payload
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        inlineTaskForm.reset();
        renderTaskPhaseOptions();
        await refreshPlan();
        setStatus('Arbeitspaket gespeichert.');
      } catch (err) {
        setStatus('Arbeitspaket konnte nicht gespeichert werden (' + err.message + ').', true);
      }
    });

    init();
