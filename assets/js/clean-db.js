// Runs lightweight migrations against the json-server data.
// Currently removes deprecated "spread" flag from work packages
// and ensures phases have projectWide (default false).
export async function cleanDB() {
  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin?.startsWith('file:')
        ? 'http://localhost:3000'
        : '';

    // Migrate work packages (remove spread)
    const res = await fetch(base + '/workPackages');
    if (!res.ok) return; // don't block UI; just skip migration
    const packages = await res.json();
    const toUpdate = packages.filter(p => Object.prototype.hasOwnProperty.call(p, 'spread'));
    for (const pkg of toUpdate) {
      const { id, spread, ...rest } = pkg; // drop spread
      const sanitized = { id, ...rest };
      const putRes = await fetch(`${base}/workPackages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (!putRes.ok) {
        console.error('cleanDB: failed to update package', id, putRes.status);
      }
    }

    // Ensure phases have projectWide flag
    const phaseRes = await fetch(base + '/phases');
    if (phaseRes.ok) {
      const phases = await phaseRes.json();
      const missing = phases.filter(p => !Object.prototype.hasOwnProperty.call(p, 'projectWide'));
      for (const ph of missing) {
        const putRes = await fetch(`${base}/phases/${ph.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ph, projectWide: false })
        });
        if (!putRes.ok) {
          console.error('cleanDB: failed to update phase', ph.id, putRes.status);
        }
      }
    }
  } catch (err) {
    console.error('cleanDB failed', err);
  }
}
