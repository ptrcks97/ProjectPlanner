import { apiRequest } from './dashboard/api.js';
import { fmt, isoWeek, startOfWeek, statusChip } from './dashboard/utils.js';
import { cleanDB } from './clean-db.js';
import { HELP_COPY, CHART_TYPES, KANBAN_LABELS, PW_COLOR } from './dashboard/constants.js';
import { normalizeCriteria, addCriteriaRow, resetCriteriaForm, collectCriteriaFromForm, renderDetailCriteria } from './dashboard/criteria.js';
import { computeSchedule, filterPlan, comparePhases } from './dashboard/schedule.js';
import { renderPlanTable, renderPhaseGrouped } from './dashboard/plan-renderers.js';
import { loadJournalEntries, persistJournalEntries, renderJournal as renderJournalTable, setJournalToday, setJournalStatus, exportCSV, exportMarkdown, exportPDF } from './dashboard/journal.js';
import { renderKanbanPhaseOptions as renderKanbanPhaseOptionsMod, renderKanbanBoard as renderKanbanBoardMod } from './dashboard/kanban.js';
import { blobToDataUrl } from './dashboard/download.js';

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
    const chartTypes = CHART_TYPES;
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
    const journalDom = { journalRows, journalCount, journalTotal, journalSumCell, journalStatus };
    const showJournalStatus = (text, isError = false) => setJournalStatus(journalDom, text, isError);

    // Forecast view
    const forecastRows = document.getElementById('forecast-rows');
    const forecastStatus = document.getElementById('forecast-status');
    const forecastCardStart = document.getElementById('forecast-start-date');
    const forecastCardHours = document.getElementById('forecast-hours-total');
    const forecastCardDays = document.getElementById('forecast-days-total');
    const forecastCardEnd = document.getElementById('forecast-end-date');
    const forecastCardWeek = document.getElementById('forecast-week-avg');
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
    const criteriaList = document.getElementById('task-criteria-list');
    const criteriaAddBtn = document.getElementById('task-criteria-add');
    const inlineCriteriaList = document.getElementById('inline-criteria-list');
    const inlineCriteriaAddBtn = document.getElementById('inline-criteria-add');
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
    const detailCriteria = document.getElementById('detail-criteria');
    // inline task form
    const inlineTaskForm = document.getElementById('inline-task-form');
    const inlineTaskPhase = document.getElementById('inline-task-phase');
    const inlineTaskName = document.getElementById('inline-task-name');
    const inlineTaskDesc = document.getElementById('inline-task-desc');
    const inlineTaskStatus = document.getElementById('inline-task-status');
    const inlineTaskParallel = document.getElementById('inline-task-parallel');
    const inlineTaskTime = document.getElementById('inline-task-time');
    const reloadBtn = document.getElementById('reload-btn');
    let editingId = null;

    // Phase form elements
    const phaseForm = document.getElementById('phase-form');
    const phaseIdInput = document.getElementById('phase-id');
    const phaseNameInput = document.getElementById('phase-name');
    const phaseDescInput = document.getElementById('phase-desc');
    const phaseColorInput = document.getElementById('phase-color');
    const phaseProjectWideInput = document.getElementById('phase-projectwide');
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
    let phaseListDragId = null;
    let packages = [];
    let weekly = null;
    let startStr = null;
    let planCache = [];
    let filterMode = 'all';
    const aggregatedPlan = () => filterPlan(planCache, filterMode);

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
      const normalized = arr.map((p, idx) => ({
        ...p,
        projectWide: !!p.projectWide,
        sortIndex: Number.isFinite(Number(p.sortIndex)) ? Number(p.sortIndex) : (Number(p.id ?? idx) || idx)
      }));
      phases = normalized.sort(comparePhases);
      renderPhaseList();
      renderJournalPhaseOptions();
      renderTaskPhaseOptions();
    }

    async function loadPackages() {
      const res = await apiRequest(`/workPackages`);
      if (!res.ok) return;
      const arr = await res.json();
      const phaseIds = new Set(phases.map(p => p.id));
      packages = arr
        .filter(w => w.projectId === projectId || phaseIds.has(w.phaseId))
        .map(w => ({
          ...w,
          acceptanceCriteria: Array.isArray(w.acceptanceCriteria)
            ? w.acceptanceCriteria.map(c => ({ text: (c.text || '').trim(), done: !!c.done }))
            : []
        }));
      renderJournalPackageOptions();
    }

    /* ---------- Arbeitsjournal ---------- */
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
      journalEntries = loadJournalEntries(projectId);
      renderJournalTable(journalEntries, journalDom);
    }

    function persistJournal() {
      persistJournalEntries(projectId, journalEntries);
    }

    function renderJournal() {
      renderJournalTable(journalEntries, journalDom);
    }

    /* ---------- Exporte ---------- */
    function toggleDownloadPanel(show) {
      if (!downloadPanel) return;
      const shouldShow = show ?? downloadPanel.classList.contains('hidden');
      downloadPanel.classList.toggle('hidden', !shouldShow);
    }

    // computeSchedule, filterPlan imported from ./dashboard/schedule.js

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

    async function updatePhaseSequence(orderedIds) {
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          const phaseId = orderedIds[i];
          const phase = phases.find(p => p.id === phaseId);
          if (!phase) continue;
          const currentIdx = Number.isFinite(Number(phase.sortIndex)) ? Number(phase.sortIndex) : null;
          if (currentIdx === i) { phase.sortIndex = i; continue; }
          const res = await apiRequest(`/phases/${phaseId}`, {
            method: 'PUT',
            body: { ...phase, sortIndex: i, projectId }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          phase.sortIndex = i;
        }
        await refreshPlan();
        setStatus('Phasen neu sortiert.');
      } catch (err) {
        setStatus('Sortierung fehlgeschlagen (' + err.message + ').', true);
      }
    }

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

    detailCriteria?.addEventListener('change', async (e) => {
      const checkbox = e.target.closest('input[type="checkbox"]');
      const row = e.target.closest('.criteria-check');
      if (!checkbox || !row) return;
      const idx = Number(row.dataset.idx);
      const id = Number(detailId?.textContent);
      const pkg = packages.find(p => p.id === id);
      if (!pkg || Number.isNaN(idx)) return;
      const list = normalizeCriteria(pkg.acceptanceCriteria);
      if (idx < 0 || idx >= list.length) return;
      list[idx].done = checkbox.checked;
      pkg.acceptanceCriteria = list;
      try {
        await persistPackage(pkg);
        const allDone = list.length > 0 && list.every(c => c.done);
        if (allDone && (pkg.status || 'Backlog') !== 'Finished') {
          const confirmFinish = window.confirm('Du hast alle Kriterien erfüllt, willst du das Paket auf Finished setzen?');
          if (confirmFinish) {
            pkg.status = 'Finished';
            await persistPackage(pkg);
          }
        }
        await refreshPlan();
        // Paket kann nach refresh ersetzt sein, hole es neu
        const updated = packages.find(p => p.id === id) || pkg;
        renderDetailCriteria(updated, detailCriteria);
        detailStatus.innerHTML = statusChip(updated.status || 'ToDo');
        detailStatusPlain.textContent = statusLabel(updated.status);
      } catch (err) {
        setStatus('Speichern fehlgeschlagen (' + err.message + ').', true);
        checkbox.checked = !checkbox.checked;
      }
    });

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
        phaseRows.innerHTML = '<div class="muted">Keine Phasen.</div>';
        return;
      }
      phaseRows.innerHTML = phases.map((p, idx) => `
        <div class="phase-row" draggable="true" data-phase-id="${p.id}" data-sort-index="${p.sortIndex ?? idx}" style="background:${(p.color || '#22d3ee')}18; border-color:${(p.color || '#22d3ee')}40;">
          <div class="phase-row-left">
            <span class="phase-drag-handle" title="Ziehen, um Reihenfolge zu ändern" aria-hidden="true">
              <span class="material-symbols-rounded">drag_indicator</span>
            </span>
            <div class="phase-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end; flex-shrink:0;">
            ${p.projectWide ? '<span class="pill pill-ghost" title="Über ganzes Projekt">Projektweit</span>' : ''}
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
        await cleanDB();
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

    // Action buttons in "Nach Phase" view
    phaseView?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit]');
      const delBtn = e.target.closest('[data-delete]');
      if (!editBtn && !delBtn) return;
      const id = Number(editBtn?.dataset.edit || delBtn?.dataset.delete);
      if (Number.isNaN(id)) return;
      if (editBtn) {
        const pkg = packages.find(p => p.id === id);
        if (pkg) openModal(pkg, 'edit');
      } else if (delBtn) {
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

    // Drag & drop for reordering phases in settings
    phaseRows.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.phase-row[draggable="true"]');
      if (!row) return;
      phaseListDragId = Number(row.dataset.phaseId);
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });

    phaseRows.addEventListener('dragend', () => {
      phaseListDragId = null;
      phaseRows.querySelectorAll('.phase-row').forEach(r => r.classList.remove('drag-over', 'dragging'));
    });

    phaseRows.addEventListener('dragover', (e) => {
      const row = e.target.closest('.phase-row[draggable="true"]');
      if (!row || phaseListDragId === null) return;
      e.preventDefault();
      row.classList.add('drag-over');
    });

    phaseRows.addEventListener('dragleave', (e) => {
      const row = e.target.closest('.phase-row[draggable="true"]');
      if (row) row.classList.remove('drag-over');
    });

    phaseRows.addEventListener('drop', async (e) => {
      const target = e.target.closest('.phase-row[draggable="true"]');
      if (!target || phaseListDragId === null) return;
      e.preventDefault();
      const rows = Array.from(phaseRows.querySelectorAll('.phase-row[draggable="true"]'));
      const orderedIds = rows.map(r => Number(r.dataset.phaseId));
      const dragIndex = orderedIds.indexOf(phaseListDragId);
      const targetIndex = orderedIds.indexOf(Number(target.dataset.phaseId));
      if (dragIndex > -1 && targetIndex > -1 && dragIndex !== targetIndex) {
        orderedIds.splice(dragIndex, 1);
        orderedIds.splice(targetIndex, 0, phaseListDragId);
        await updatePhaseSequence(orderedIds);
      }
      phaseListDragId = null;
      rows.forEach(r => r.classList.remove('drag-over', 'dragging'));
    });

    function loadPhaseIntoForm(id) {
          const phase = phases.find(p => p.id === id);
          if (!phase) return;
          phaseIdInput.value = phase.id;
          phaseNameInput.value = phase.name;
          phaseDescInput.value = phase.description || '';
          phaseColorInput.value = sanitizeColor(phase.color);
          if (phaseProjectWideInput) phaseProjectWideInput.checked = !!phase.projectWide;
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

    async function persistPackage(pkg) {
      const body = { ...pkg };
      if ((body.status || 'Backlog') === 'Finished') {
        body.doneDate = body.doneDate || new Date().toISOString();
      } else {
        body.doneDate = null;
      }
      const res = await apiRequest(`/workPackages/${pkg.id}`, {
        method: 'PUT',
        body
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    }

    function openModal(pkg, mode = 'edit') {
      editingId = mode === 'edit' ? pkg.id : null;
      modalMode.textContent = mode === 'edit' ? 'Arbeitspaket bearbeiten' : 'Arbeitspaket erstellen';
      modalTitle.textContent = mode === 'edit' ? pkg.name : 'Neues Arbeitspaket';
      taskName.value = pkg?.name || '';
      taskDesc.value = pkg?.description || '';
      taskStatus.value = pkg?.status || 'ToDo';
      taskParallel.checked = !!pkg?.parallel;
      taskTime.value = pkg?.time ?? 0;
      const selectedPhase = pkg?.phaseId ?? '';
      taskPhase.innerHTML = `<option value="">(keine Phase)</option>` + phases.map(p => `<option value="${p.id}" ${p.id === selectedPhase ? 'selected' : ''}>${p.name}</option>`).join('');
      resetCriteriaForm(pkg?.acceptanceCriteria || [], criteriaList);
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
      detailStatus.innerHTML = statusChip(pkg.status || 'ToDo');
      detailStatusPlain.textContent = statusLabel(pkg.status);
      detailHours.textContent = `${pkg.time ?? '-'} h`;
      renderDetailCriteria(pkg, detailCriteria);
      const sched = planCache.find(p => p.id === pkg.id);
      detailStart.textContent = sched?.start ? sched.start.toLocaleDateString('de-CH') : '-';
      detailEnd.textContent = sched?.end ? sched.end.toLocaleDateString('de-CH') : '-';
      detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
      detailModal?.classList.add('hidden');
    }

    const renderPlanTableView = () => {
      renderPlanTable(aggregatedPlan(), phases, rows);
    };

    const renderPhaseGroupedView = () => {
      renderPhaseGrouped(aggregatedPlan(), phases, phaseView);
    };

    /* ---------- Kanban ---------- */
    function renderKanbanPhaseOptions() {
      renderKanbanPhaseOptionsMod(phases, kanbanPhaseSelect);
    }

    function renderKanbanBoard() {
      renderKanbanBoardMod({
        boardEl: kanbanBoard,
        phaseSelectEl: kanbanPhaseSelect,
        phases,
        packages,
        onStatusChange: refreshPlan
      });
    }

    function renderCurrentView() {
      viewPlan.classList.add('hidden');
      viewPhase.classList.add('hidden');
      viewChart.classList.add('hidden');
      if (filterGroup) filterGroup.classList.add('hidden');
      fullscreenBtn.classList.add('hidden');
      if (currentView === 'plan') {
        viewPlan.classList.remove('hidden');
        renderPlanTableView();
        if (filterGroup) filterGroup.classList.remove('hidden');
      } else if (currentView === 'phase') {
        viewPhase.classList.remove('hidden');
        renderPhaseGroupedView();
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

    const PW_COLOR = '#f59e0b';
    function isProjectWidePhase(pid) {
      if (pid === null || pid === undefined || pid === 'none') return false;
      const ph = phases.find(p => p.id === Number(pid));
      return !!ph?.projectWide;
    }

    function phaseLabel(pid) {
      if (pid === 'none' || pid === null || pid === undefined) return 'Ohne Phase';
      const ph = phases.find(p => p.id === Number(pid));
      if (!ph) return 'Ohne Phase';
      return ph.projectWide ? `${ph.name} ★` : ph.name;
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
      const phaseName = (pid) => phaseLabel(pid);
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
        const projectWide = isProjectWidePhase(pid);
        const barHeight = isZoomed ? 32 : 26;
        const barSpacing = isZoomed ? 44 : 32;
        const rowIndex = new Map();
        let rowCount = 0;
        const rowsForItems = items.map(t => {
          const key = `task-${t.id}`;
          if (!rowIndex.has(key)) rowIndex.set(key, rowCount++);
          return rowIndex.get(key);
        });
        const barRows = items.map((t, idx) => {
          const startOffset = (t.start - minStart) / 86400000;
          const duration = ((t.end - t.start) / 86400000) + 1;
          const left = (startOffset / totalDays) * 100;
          const width = (duration / totalDays) * 100 * barScale;
          const row = rowsForItems[idx];
          const highlight = projectWide ? `box-shadow:0 0 0 2px ${PW_COLOR}; border:1px solid ${PW_COLOR};` : '';
          return `<div class="gantt-bar small" style="left:${left}%;width:${width}%;background:${color};top:${row*barSpacing}px;height:${barHeight}px;${highlight}">${t.name}</div>`;
        }).join('');
        const trackHeight = Math.max(barSpacing, rowCount * barSpacing + 12);
        return `
          <div class="gantt-row">
            <div class="gantt-label" style="background:${rowBg};${projectWide ? `border-left:4px solid ${PW_COLOR};` : ''}">${phaseName(pid)}</div>
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
        const label = phaseLabel(pid);
        const rowBg = pid === 'none' ? 'rgba(255,255,255,0.02)' : `${color}20`;
        const projectWide = isProjectWidePhase(pid);
        const barHeight = isZoomed ? 30 : 26;
        const trackHeight = barHeight + 12;
        return `
          <div class="gantt-row">
            <div class="gantt-label" style="background:${rowBg};${projectWide ? `border-left:4px solid ${PW_COLOR};` : ''}">${label}</div>
            <div class="gantt-track" style="height:${trackHeight}px; background:${rowBg};">
              <div class="gantt-grid" style="grid-template-columns: repeat(${totalDays}, ${dayWidth}%); position:absolute; inset:0; pointer-events:none;"></div>
              <div class="gantt-bar small" style="left:${left}%;width:${width}%;background:${color};top:8px;height:${barHeight}px;${projectWide ? `box-shadow:0 0 0 2px ${PW_COLOR}; border:1px solid ${PW_COLOR};` : ''}">${label}</div>
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
          label: ph ? (ph.projectWide ? `${ph.name} ★` : ph.name) : 'Ohne Phase',
          projectWide: !!ph?.projectWide,
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
            <span class="legend-swatch" style="background:${it.color};${it.projectWide ? `box-shadow:0 0 0 2px ${PW_COLOR}; border:1px solid ${PW_COLOR};` : ''}"></span>
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
              <div class="bar-fill" style="width:${(it.value / max * 100).toFixed(1)}%; background:${it.color};${it.projectWide ? `box-shadow:0 0 0 2px ${PW_COLOR}; border:1px solid ${PW_COLOR};` : ''}"></div>
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
      // Zähle erledigte Stunden bis heute. Wenn kein doneDate hinterlegt ist (Alt-Daten),
      // wird der Abschluss auf "heute" gesetzt, damit fertig markierte Pakete nicht
      // erst am geplanten Enddatum zählen.
      const completedPlannedHours = planCache
        .filter(p => (p.status || 'Backlog') === 'Finished')
        .reduce((s, p) => {
          const done = p.doneDate ? new Date(p.doneDate) : today;
          return done <= today ? s + (Number(p.hours) || 0) : s;
        }, 0);

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

    criteriaAddBtn?.addEventListener('click', () => addCriteriaRow('', false, criteriaList));
    inlineCriteriaAddBtn?.addEventListener('click', () => addCriteriaRow('', false, inlineCriteriaList));
    resetCriteriaForm([], inlineCriteriaList);

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
        acceptanceCriteria: collectCriteriaFromForm(criteriaList)
      };
      if (!payload.name) {
        setStatus('Name darf nicht leer sein.', true);
        return;
      }
      if (Number.isNaN(payload.time)) {
        setStatus('Bitte gueltige Stunden angeben.', true);
        return;
      }
      const hasCriteria = payload.acceptanceCriteria.length > 0;
      const allCriteriaDone = payload.acceptanceCriteria.every(c => c.done);
      if (payload.status === 'Finished' && hasCriteria && !allCriteriaDone) {
        const confirmFinish = window.confirm('Nicht alle Akzeptanzkriterien sind erledigt. Willst du alle als erledigt markieren und abschliessen?');
        if (confirmFinish) {
          payload.acceptanceCriteria = payload.acceptanceCriteria.map(c => ({ ...c, done: true }));
        } else {
          setStatus('Speichern abgebrochen, offene Akzeptanzkriterien.', true);
          return;
        }
      }
      if (payload.status !== 'Finished' && hasCriteria && allCriteriaDone) {
        const confirmAutoFinish = window.confirm('Du hast alle Kriterien erfüllt, Paket auf Finished setzen?');
        if (confirmAutoFinish) {
          payload.status = 'Finished';
          taskStatus.value = 'Finished';
        }
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
      const isEdit = !!phaseIdInput.value;
      const existing = isEdit ? phases.find(p => p.id === Number(phaseIdInput.value)) : null;
      const nextSortIndex = (() => {
        if (existing && Number.isFinite(Number(existing.sortIndex))) return Number(existing.sortIndex);
        if (!phases.length) return 0;
        const max = Math.max(...phases.map(p => Number.isFinite(Number(p.sortIndex)) ? Number(p.sortIndex) : 0));
        return max + 1;
      })();
      const payload = {
        name: phaseNameInput.value.trim(),
        description: phaseDescInput.value.trim(),
        color: sanitizeColor(phaseColorInput.value),
        projectId,
        projectWide: !!phaseProjectWideInput?.checked,
        sortIndex: nextSortIndex
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
        if (phaseProjectWideInput) phaseProjectWideInput.checked = false;
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
    phaseForm.addEventListener('reset', () => {
      if (phaseProjectWideInput) phaseProjectWideInput.checked = false;
    });

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
        showJournalStatus('Bitte Titel und Beschreibung ausfüllen.', true);
        return;
      }
      if (Number.isNaN(hours)) {
        showJournalStatus('Bitte eine Stundenanzahl angeben.', true);
        return;
      }

      const entry = { title, description, phase, packageId, packageName, hours: hours.toFixed(2), date };
      if (journalEditIndex !== null) {
        journalEntries[journalEditIndex] = entry;
        showJournalStatus('Eintrag aktualisiert.');
      } else {
        journalEntries.unshift(entry);
        showJournalStatus('Eintrag gespeichert.');
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
        showJournalStatus('Eintrag gelöscht.');
        if (journalEditIndex === index) resetJournalForm();
        return;
      }
      if (editBtn) {
        const index = Number(editBtn.dataset.editJournal);
        startJournalEdit(index);
      }
    });

    function initJournal() {
      setJournalToday(journalDate);
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
      showJournalStatus('Bearbeitung aktiviert.');
    }

    function resetJournalForm() {
      journalEditIndex = null;
      journalForm.reset();
      setJournalToday(journalDate);
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
      if (!journalEntries.length) { showJournalStatus('Keine Einträge zum Export.', true); return; }
      const totalText = journalTotal?.textContent ?? '';
      if (type === 'csv') exportCSV(journalEntries, projectId, false);
      else if (type === 'csv-lite') exportCSV(journalEntries, projectId, true);
      else if (type === 'md') exportMarkdown(journalEntries, projectId, totalText);
      else if (type === 'pdf') {
        const ok = exportPDF(journalEntries, projectId, totalText);
        if (!ok) showJournalStatus('Popup blockiert – bitte erlauben.', true);
      }
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
        time: Number(inlineTaskTime.value),
        acceptanceCriteria: collectCriteriaFromForm(inlineCriteriaList)
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
