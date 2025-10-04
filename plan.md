# LuvUMore – Implementation Plan (Node + SQLite + Basic Auth)

## Overview

Eine kleine, mobile-first Web-App, mit der ihr pro Tag den Gewinner festlegt, wer „ich liebe dich mehr“ zuerst gesagt hat. Die App läuft als Docker-Container auf deinem Unraid-Server und ist über NginX Proxy Manager (NPM) per Subdomain erreichbar.

Getroffene Entscheidungen:
- Backend: Node.js (LTS) + Hono (leichtgewichtig) + Drizzle ORM
- Datenbank (MVP): SQLite (persistentes Volume) – später optional PostgreSQL
- Auth: Basic Auth via NginX Proxy Manager (Reverse Proxy)
- Subdomain: luvumore.gurkenvernichter.de
- Namen/Labels: „Nico“ und „Nena“
- Frontend: Vue 3 + Vite + Tailwind CSS (mobile-first)

Ziel: Minimal lauffähige Version mit zwei großen Buttons (Nico/Nena), Speicherung des Tagesgewinners (1 Eintrag pro Datum), Anzeige „Heutiger Gewinner“ und einfache Historie/Stats in späteren Phasen.

---

## Current State Analysis

- Repo ist leer bis auf `README.md`.
- Infrastruktur-Ziel: Docker auf Unraid, Reverse Proxy via NPM.
- Keine bestehenden Migrations-/DB-Skripte.

Constraints/Annahmen:
- „Heute“ wird auf Serverseite anhand einer konfigurierbaren TZ berechnet (Standard: Europe/Berlin).
- Basic Auth wird vollständig im NPM konfiguriert (App-seitig vorerst keine zusätzliche Auth-Schicht).
- Datenpersistenz via Docker-Volume `/data` (SQLite-Datei `app.db`).

---

## Desired End State

Nach Abschluss von Phase 1–2:
- HTTPS-Zugriff über `https://luvumore.gurkenvernichter.de` via NPM
- Login per Basic Auth (NPM), danach Erreichen der App
- Startseite mit zwei großen Buttons „Nico“ / „Nena“
- Ein Klick speichert den Gewinner für „heute“ (TZ-basiert) idempotent (ein Datums-PK)
- „Heutiger Gewinner“ wird angezeigt; bei erneutem Klick wird der Eintrag des Tages überschrieben
- Daten bleiben nach Container-Neustart erhalten (Volume)

Verifikation:
- Healthcheck `GET /api/health` liefert 200 „ok“
- `GET /api/today` zeigt Gewinner oder `null`
- Manuelles Speichern/Überschreiben funktioniert
- Zugriff mobil (Smartphone) problemlos, Buttons gut bedienbar

---

## Data Model (MVP)

Tabelle: `winners`
- `date` TEXT (Format `YYYY-MM-DD` im konfigurierten TZ) – Primary Key
- `winner` TEXT (Enum-Logik auf App-Seite: `nico` | `nena`)
- `recorded_at` TIMESTAMP (UTC)
- `source` TEXT (z. B. `ui`, später auch `whatsapp`/`n8n`)
- `note` TEXT, optional

Konfliktstrategie: Ein Eintrag pro Datum. Neues Speichern am gleichen Tag überschreibt nur bei Nachfrage.

---

## API Design

- `GET /api/health` → `{ status: "ok" }`
- `GET /api/today` → `{ date: "YYYY-MM-DD", winner: "nico" | "nena" | null }`
- `POST /api/today` Body `{ winner: "nico" | "nena" }` → 200, speichert/überschreibt heutigen Tag
- `GET /api/stats?range=30d` → letzte N Tage + Summen (Phase 3)
- `POST /api/webhook/n8n` (später) → Webhook mit Secret für Automatisierung

Validierung/Fehler:
- Body-Validierung (winner Pflicht, Wertebereich)
- 400 bei ungültigem Input, 500 bei DB-Fehlern

---

## Frontend (Vue 3 + Vite + Tailwind)

- Mobile-first Layout, Touch-Targets ≥ 44px, zwei große Buttons (vollbreit)
- Anzeige: „Heutiger Gewinner: <Name>“
- Kleiner Link zur History (Phase 3)
- Dark Mode optional via `prefers-color-scheme`

Labels/Anzeigenamen konfigurierbar per ENV (Standard: Nico/Nena); in der UI entsprechend dargestellt.

---

## Security & Auth

- Basic Auth ausschließlich im NginX Proxy Manager (NPM) für die Subdomain
- App-intern vorerst keine zusätzliche Auth (kann später ergänzt werden)
- CSRF-Risiko minimal (private Nutzung, Basic Auth Schutz, kein CORS)
- Rate Limit optional in Phase 5

---

## Environment Variables

- `TZ` (z. B. `Europe/Berlin`)
- `PARTNER_A_NAME` (Default: `Nico`)
- `PARTNER_B_NAME` (Default: `Nena`)
- `DB_PATH` (Default: `/data/app.db` für SQLite)
- Später (optional Postgres): `DB_URL`

---

## Implementation Approach

- Monolithischer Container: Node-Server (Hono) liefert API und statische, vorab gebaute Frontend-Dateien aus.
- DB-Access mit Drizzle ORM (+ `better-sqlite3` für SQLite). Später einfache Migration auf Postgres möglich.
- Zeitlogik: `date-fns-tz` zur Bestimmung „heute“ in `TZ`; Speicherung eines ISO-Datumsstrings (YYYY-MM-DD) als PK.
- Docker: Multi-Stage-Build (Frontend bauen, Assets in `public/`/`dist/` kopieren, Node Runtime minimal), Healthcheck.

---

## Phases

### Phase 0 – Finalisierung Entscheidungen & Projektparameter
- Bestätigt: Node, SQLite, Basic Auth (NPM), Subdomain, Namen
- Projektstruktur definieren

Success Criteria
- Manuell: Entscheidungen dokumentiert (dieser Plan), keine offenen Fragen für MVP

---

### Phase 1 – MVP Backend + Frontend + SQLite

Backend
- Hono-Server (`/server/src/index.ts`)
- Routen: `/api/health`, `/api/today` (GET/POST)
- DB: Drizzle Schema `winners`, Adapter `better-sqlite3`, Datei `DB_PATH` (default `/data/app.db`)
- Zeit: „heute“ via `TZ` berechnen, `YYYY-MM-DD`

Frontend
- Vue 3 + Vite + Tailwind Skeleton
- Startseite mit zwei Buttons (Nico/Nena), Anzeige „heute“, Fehlerhandling

Deliverables
- `package.json` (root oder getrennt für server/web), Build-Skripte
- `Dockerfile` (Multi-Stage), `docker-compose.yml` (mit Volume `/data`)
- Mini-Tests (API: happy path, overwrite)

Success Criteria
- Automated
  - Unit/API Tests grün (mind. für `/api/today` GET/POST)
  - Lint/Format ohne Fehler
  - Docker-Image baut lokal
  - Healthcheck Endpoint 200
- Manual
  - Buttons funktionieren am Smartphone (lokal im WLAN via IP/Port)
  - SQLite-DB persistiert Einträge über Neustarts (Volume)

---

### Phase 2 – Deployment auf Unraid + NPM

- Bereitstellung der `docker-compose.yml` auf Unraid
- NPM: Host `luvumore.gurkenvernichter.de` → Weiterleitung auf Container:3000
- NPM: SSL aktivieren (Let’s Encrypt), Basic Auth-User anlegen

Success Criteria
- Automated
  - Container startet mit ENV, `GET /api/health` ok (über Proxy oder direkt)
- Manual
  - `https://luvumore.gurkenvernichter.de` erreichbar
  - Basic Auth greift
  - UI bedienbar, Speichern funktioniert live

---

### Phase 3 – History & Stats

- Backend: `GET /api/stats?range=30d` (hist. Liste + Summen)
- Frontend: History-Ansicht (letzte 30 Tage), einfache Summen, Farbcodierung

Success Criteria
- Automated
  - Tests für Range/Statistik
- Manual
  - History plausibel, Summen korrekt

---

### Phase 4 – Optional: PostgreSQL-Unterstützung

- Umschaltbar via `DB_URL` (wenn gesetzt → Postgres, sonst SQLite)
- Migrationsstrategie (Drizzle Kit)

Success Criteria
- Automated
  - Migration läuft gegen PG-Container
  - Tests laufen gegen beide Backends (Matrix)
- Manual
  - Umschalten ohne Verhaltensänderung

---

### Phase 5 – Sicherheit & Politur

- Rate Limiting (leichtgewichtig) auf API-Ebene
- Verbesserte Fehlerseiten, Logging, Backups (SQLite-Datei / PG-Dumps)

Success Criteria
- Automated
  - Limit-Test (z. B. Burst-limit)
- Manual
  - Test-Backup/Restore erfolgreich

---

### Phase 6 – n8n/WhatsApp-Integration (später)

- Webhook `POST /api/webhook/n8n` mit Secret-Header
- n8n-Flow erkennt WhatsApp-Muster, ruft Webhook auf → speichert Gewinner des Tages (`source = whatsapp`)

Success Criteria
- Automated
  - Secret/Signatur geprüft in Tests
- Manual
  - E2E-Flow legt Tagesgewinner korrekt an

---

## Testing Strategy

- Unit Tests: API (Input-Validierung), Zeitberechnung „heute“ (TZ)
- Integration: DB-Schreib-/Lesewege (SQLite), minimaler End-to-End-Test (Button → POST → GET)
- Frontend: einfacher Component-Test (Button-Klick triggert POST)
- Tools: Vitest + Supertest (oder Hono Testing Utilities)

---

## Docker & Compose

- Dockerfile (Multi-Stage)
  - Stage 1: Frontend build (Vite)
  - Stage 2: Node Runtime, kopiert `dist/` als statische Assets + Server-Code
  - Gesundheit: `HEALTHCHECK` auf `/api/health`
- docker-compose.yml
  - Service `app`: Ports 3000, Volume `./data:/data`, ENV (`TZ`, `PARTNER_*`, `DB_PATH`)
  - Optional zweites Compose-File für Produktions-Overrides

---

## Unraid + NginX Proxy Manager Setup (Kurzleitfaden)

1) App-Container via Compose starten (intern Port 3000)
2) NPM: Neuer Proxy Host
   - Domain: `luvumore.gurkenvernichter.de`
   - Forward Host/IP: Unraid-Host-IP (oder interner DNS) + Port 3000
   - SSL: Let’s Encrypt (Force SSL, HTTP/2, HSTS optional)
   - Access: Enable Access List → Basic Auth-User anlegen (z. B. Familie)
3) Test: `https://luvumore.gurkenvernichter.de` → Login → App erreichbar

---

## Edge Cases

- Doppeltes Tippen: idempotent – gleiches Datum überschreibt nur bei Nachfrage
- Tageswechsel: „heute“ wechselt exakt um 00:00 in `TZ`
- Uhrzeit/Drift: Server-Zeit vs. TZ – nur Datum speichern
- Netzwerkfehler: UI zeigt Retry/Fehler

---

## What We’re NOT Doing (MVP)

- Kein komplexes User-/Rollenmanagement
- Keine öffentlichen/teilbaren Links
- Keine E-Mail/Push-Notifications
- Keine großen Analytics/Charts (nur Basics in Phase 3)

---

## Next Steps (konkret)

- Phase 1 umsetzen: Projektgerüst, API, SQLite, UI, Dockerfile, Compose, Mini-Tests
- Danach Phase 2: Deployment auf Unraid + NPM-Konfiguration

Hinweis: Wenn du willst, kann ich direkt das Scaffolding anlegen (Ordnerstruktur, Basis-Code, Docker, Tests). Sag einfach Bescheid, dann setze ich Phase 1 um.
