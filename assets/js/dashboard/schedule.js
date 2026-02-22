import { startOfWeek } from './utils.js';

export function computeSchedule({ startDate, weekly, phases, packages }) {
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

  const orderedPhases = [...phases].sort(comparePhases);
  const phaseOrder = orderedPhases.map(p => p.id);
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

  const tasks = sortPackages(packages);

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
            parallel: !!g.parallel
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
        parallel: !!pkg.parallel
      });
    }

    const maxEnd = plan.length ? new Date(Math.max(...plan.map(p => p.end))) : new Date(startDate);
    const distinctDays = new Set(plan.flatMap(p => [p.start.toDateString(), p.end.toDateString()])).size;
    const totalHours = plan.reduce((s, p) => s + (Number(p.hours) || 0), 0);
    return { plan, maxEnd, days: distinctDays, totalHours };
  }

  const { plan, days } = scheduleSequential(tasks, weeklyMap);
  const totalHours = tasks.reduce((s, p) => s + (Number(p.time) || 0), 0);

  return { plan, totalHours, days };
}

export function filterPlan(planCache, filterMode, now = new Date()) {
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

export function comparePhases(a, b) {
  const ai = Number.isFinite(Number(a.sortIndex)) ? Number(a.sortIndex) : Number(a.id ?? 0);
  const bi = Number.isFinite(Number(b.sortIndex)) ? Number(b.sortIndex) : Number(b.id ?? 0);
  if (ai !== bi) return ai - bi;
  return (a.id ?? 0) - (b.id ?? 0);
}
