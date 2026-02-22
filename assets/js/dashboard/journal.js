import { JOURNAL_KEY_PREFIX } from './constants.js';
import { downloadFile } from './download.js';

export function journalKey(projectId) {
  return `${JOURNAL_KEY_PREFIX}${projectId || 'unknown'}`;
}

export function loadJournalEntries(projectId) {
  const raw = localStorage.getItem(journalKey(projectId));
  return raw ? JSON.parse(raw) : [];
}

export function persistJournalEntries(projectId, entries) {
  localStorage.setItem(journalKey(projectId), JSON.stringify(entries));
}

export function renderJournal(entries, dom) {
  const { journalRows, journalCount, journalTotal, journalSumCell } = dom;
  if (!journalRows) return;
  if (!entries.length) {
    journalRows.innerHTML = '<tr><td colspan="7">Noch keine Einträge.</td></tr>';
    if (journalCount) journalCount.textContent = '0';
    if (journalTotal) journalTotal.textContent = '0.00 h';
    if (journalSumCell) journalSumCell.textContent = '0.00';
    return;
  }
  journalRows.innerHTML = entries.map((entry, idx) => `
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
  if (journalCount) journalCount.textContent = entries.length;
  const total = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
  if (journalTotal) journalTotal.textContent = `${total.toFixed(2)} h`;
  if (journalSumCell) journalSumCell.textContent = total.toFixed(2);
}

export function setJournalToday(input) {
  if (!input) return;
  const today = new Date().toISOString().split('T')[0];
  input.value = today;
}

export function setJournalStatus(dom, text, isError = false) {
  if (!dom.journalStatus) return;
  dom.journalStatus.textContent = text;
  dom.journalStatus.classList.toggle('error', isError);
}

export function exportCSV(entries, projectId, reduced = false) {
  const header = reduced
    ? ['Titel', 'Beschreibung', 'Datum', 'Stunden']
    : ['Titel', 'Beschreibung', 'Phase', 'Arbeitspaket', 'Stunden', 'Datum'];
  const rows = entries.map(e => reduced
    ? [e.title, (e.description || '').replace(/"/g, '""'), e.date, e.hours]
    : [e.title, (e.description || '').replace(/"/g, '""'), e.phase || '', e.packageName || '', e.hours, e.date]);
  const lines = [header.join(';'), ...rows.map(r => r.map(v => `"${String(v ?? '')}"`).join(';'))];
  const bom = new Uint8Array([0xEF,0xBB,0xBF]);
  const csv = lines.join('\n');
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `journal-${projectId || 'projekt'}${reduced ? '-reduced' : ''}.csv`);
}

export function exportMarkdown(entries, projectId, totalText = '') {
  const lines = [
    `# Arbeitsjournal Projekt ${projectId ?? ''}`,
    '',
    `Gesamt: ${totalText}`,
    ''
  ];
  lines.push('| Kurz | Beschreibung | Phase | Arbeitspaket | Stunden | Datum |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  entries.forEach(e => {
    lines.push(`| ${e.title} | ${(e.description || '').replace(/\\n/g, ' ')} | ${e.phase || ''} | ${e.packageName || ''} | ${e.hours} | ${e.date} |`);
  });
  downloadFile(`journal-${projectId || 'projekt'}.md`, 'text/markdown;charset=utf-8', lines.join('\n'));
}

export function exportPDF(entries, projectId, totalText = '') {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) return false;
  const style = `
    <style>
      body { font-family: "Space Grotesk", Helvetica, sans-serif; padding: 20px; background:#0b1224; color:#e2e8f0; }
      h1 { margin-top:0; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      th, td { border:1px solid #233041; padding:10px; font-size:13px; }
      th { background:#0ea5e9; color:#0b1224; }
      .chip { padding:3px 8px; border-radius:10px; background:#122033; color:#e2e8f0; border:1px solid #1f2c3f; }
    </style>`;
  const rows = entries.map(e => `
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
      <div>Einträge: ${entries.length} | Gesamtstunden: ${totalText}</div>
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
  return true;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
