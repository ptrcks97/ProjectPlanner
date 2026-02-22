export const state = {
  projectId: Number(new URLSearchParams(window.location.search).get('id')),
  projectName: '',
  weekly: null,
  startDate: null,
  durationHours: null,
  phases: [],
  packages: [],
  plan: [],
  planStats: { totalHours: 0, days: 0, endDate: null, weekAvg: null },
  filterMode: 'all',
  currentView: 'plan',
  chartIndex: 0,
  isZoomed: false,
  isFullscreen: false,
  journalEntries: [],
  journalEditIndex: null
};

export function setState(patch) {
  Object.assign(state, patch);
}

export function resetPlan() {
  state.plan = [];
  state.planStats = { totalHours: 0, days: 0, endDate: null, weekAvg: null };
}
