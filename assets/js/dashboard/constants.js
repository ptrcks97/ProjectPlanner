export const KANBAN_STATUSES = ['Backlog', 'ToDo', 'Warten', 'OnHold', 'Finished'];
export const KANBAN_LABELS = {
  Backlog: 'Backlog',
  ToDo: 'To Do',
  Warten: 'Warten',
  OnHold: 'On Hold',
  Finished: 'Finished'
};
export const KANBAN_COLOR = {
  Backlog: '#64748b',
  ToDo: '#22d3ee',
  Warten: '#f59e0b',
  OnHold: '#ef4444',
  Finished: '#22c55e'
};

export const CHART_TYPES = ['health', 'gantt', 'phasegantt', 'pie', 'bar', 'burndown'];
export const JOURNAL_KEY_PREFIX = 'work-journal-project-';
export const PW_COLOR = '#f59e0b';

export const HELP_COPY = {
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
