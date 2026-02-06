<<<<<<< HEAD
# ProjektPlanner

Leichtgewichtige Planungs-App auf Basis von json-server und Vanilla JS. Du kannst Projekte anlegen, Phasen und Arbeitspakete planen, Kapazitäten hinterlegen, automatisch Zeitpläne berechnen, Kanban & Charts nutzen und Arbeitsjournale führen. Exporte: CSV/MD/PDF sowie mehrseitiger PDF-Export aller Diagramme.

## Quick Start (Docker)
Voraussetzungen: Docker + Docker Compose Plugin.

```bash
# Build & start
docker compose up --build

# Stop
docker compose down
```

Danach läuft die App unter http://localhost:3000.

## Quick Start (lokal ohne Docker)
```bash
npm install
npm run dev   # startet json-server + statische Auslieferung
```
Standard-Port: http://localhost:3000 (änderbar via `PORT`, `DB_FILE`, `STATIC_DIR` env vars).

## Daten & Persistenz
- `db.json` enthält die Projektdaten; im Docker-Setup als Bind-Mount `.:/app` → Änderungen bleiben erhalten.
- Named Volume `node_modules` verhindert Konflikte zwischen Host- und Container-Abhängigkeiten.
- Backup: `cp db.json backups/db-$(date +%F).json`.

## Wichtige Pfade
- Frontend: `index.html`, `dashboard.html`, Assets unter `assets/js` und `assets/css`.
- API-Endpunkte (json-server): `/projects`, `/phases`, `/workPackages`, `/weeklyPlans`, `/projectStarts`.

## Nützliche Befehle
- Abhängigkeit hinzufügen (Docker): `docker compose run --rm app npm install <pkg>` danach ggf. `docker compose up --build`.
- Watch/Hot-Reload: json-server beobachtet Änderungen (Polling). Falls nicht erkannt → sicherstellen, dass Docker Zugriff aufs Host-Verzeichnis hat; `CHOKIDAR_USEPOLLING=1` ist gesetzt.

## Feature-Überblick
- Projektliste mit CRUD
- Phasen & Arbeitspakete inkl. Kapazitäten, Auto-Scheduling, Filter (Heute/Woche/Monat/Alle)
- Charts (Gantt, Phase-Gantt, Pie, Bar, Burndown) mit Fullscreen & PDF-Export aller Diagramme
- Kanban-Board mit Drag & Drop
- Arbeitsjournal pro Projekt (lokale Speicherung) mit CSV/MD/PDF-Export

## Hinweise
- Keine Authentifizierung im Standardsetup.
- Keine Build-Pipeline nötig; alles wird statisch ausgeliefert.
=======
# ProjectPlanner
A lightweight project planner (vanilla JS + json‑server) where you create projects, define phases and work packages, auto-schedule them with weekly capacities, and manage/visualize progress via tables, charts, kanban, and exports (CSV/MD/PDF, multi-chart PDF). It also includes a per-project work journal stored locally with quick exports.
>>>>>>> 604f83b06ffd0f45aa4d1347150fd2bc5f6154c8
