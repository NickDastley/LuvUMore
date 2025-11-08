# LuvUMore – Minimaler Plan (ohne Frontend-Framework, Node + SQLite)

## Zielbild

Eine extrem einfache, wartungsarme Web-App mit zwei großen Buttons (Nico/Nena). Ein Klick speichert den Tagesgewinner (ein Eintrag pro Datum). Moderne, aber schlanke Optik ohne Build-Tooling oder Frontend-Framework.

- UI: Server-gerendertes HTML (+ kleine Menge Vanilla JS) mit einer leichten CSS-Quelle per CDN (z. B. Pico.css)
- Backend: Node.js LTS + Express – pragmatisch, stabil, sehr verbreitet
- DB: SQLite via better-sqlite3 (synchron, sehr schnell, ideal für einige Tausend Einträge)
 - Auth: keine Auth im MVP; SSO als optionale Phase
- Deployment: Ein Docker-Container, Volume für SQLite
- Performance: O(1)-Zugriff auf „heute“, O(n) für Statistik über einige Tausend Zeilen ist unkritisch

Warum so: Keine Bundler, keine SPA, minimaler Overhead, schnell zu deployen, sehr wartungsarm.

---

## Funktionen (MVP)

- Startseite
  - Zeigt „Heutiger Gewinner: <Name oder —>“
  - Zwei große Buttons „Nico“ und „Nena“ (Labels via ENV konfigurierbar)
  - Klick speichert/überschreibt den Gewinner für „heute“ (TZ-basiert)
  - Auswertung über aktuellen Punktestand
- API/Server
  - GET /health → { status: "ok" }
  - GET / → HTML (Startseite + Formular/Buttons)
  - POST /today → Body winner=nico|nena, speichert für heutiges Datum
  - GET /history → einfache Liste der letzten N Tage (Phase 2)
  - GET /stats?range=30d → Summen/Verteilung (Phase 2)

---

## Datenmodell

Tabelle winners
- date TEXT PRIMARY KEY (Format YYYY-MM-DD in konfigurierter Zeitzone)
- winner TEXT ("nico" | "nena")
- recorded_at INTEGER (Unix-Epoch ms, UTC)
- source TEXT (Default: "ui")
- note TEXT NULL

DB-Initialisierung beim Start:
- CREATE TABLE IF NOT EXISTS winners (...)
- PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; (robuster und performant)

---

## Technische Entscheidungen

- Zeitzone: ENV TZ (Default Europe/Berlin). Datumsberechnung per date-fns-tz (klein, zuverlässig) – einziger Hilfs-Dependency.
- Templating: EJS oder keine Engine (String-Templates). Empfehlung: EJS wegen Lesbarkeit; 1 kleine Dependency.
- Styling: Pico.css via CDN (modernes, class-light CSS; keine Build-Chain nötig). Alternativ water.css/MVP.css.
- Kein ORM: direkte SQL-Statements mit better-sqlite3 (CRUD ist trivial, weniger bewegliche Teile).
- Logging: console.log ausreichend; später pino möglich.

---

## Projektstruktur (einfach)

- server/
  - src/
    - server.js (Express-App, Routen, DB-Init)
    - db.js (SQLite-Verbindung, Statements)
    - time.js (heute()-Hilfsfunktion mit TZ)
    - views/
      - layout.ejs
      - index.ejs
      - history.ejs (Phase 2)
  - test/
    - api.test.js (node:test oder vitest + supertest)
- public/
  - favicon.svg, kleines Logo, minimaler CSS-Snippet (optional)

Root: package.json, Dockerfile, docker-compose.yml, README.md

---

## Endpunkte & Seiten (Details)

- GET /health
  - 200 { status: "ok" }
- GET /
  - Rendert Startseite mit „Heutiger Gewinner“, Buttons
  - Buttons senden POST /today (form-urlencoded)
- POST /today
  - Validiert winner ∈ {nico, nena}
  - Berechnet todayDate = YYYY-MM-DD in TZ
  - Upsert: INSERT OR REPLACE INTO winners (date, winner, recorded_at, source) VALUES (?, ?, ?, 'ui')
  - Redirect 303 zurück auf /
- GET /history (Phase 2)
  - Optionales ?limit=30, paginiert später
- GET /stats?range=30d (Phase 2)
  - Summen: SELECT winner, COUNT(*) FROM winners WHERE date BETWEEN ? AND ? GROUP BY winner

Fehlerfälle: 400 bei ungültigem Input; 500 bei DB-Fehlern → zeigt einfache Fehlermeldung/Flash.

---

## Performance & Skalierung (für ~10k Einträge+)

- PRIMARY KEY auf date → O(1) für heute-Reads/Writes
- WAL-Modus → paralleles Lesen/Schreiben, schnelle fsyncs
- Summen/History-Queries sind linear im Range; bei 30–365 Tagen trivial schnell
- Optional: zusätzlicher INDEX auf winner für manche Aggregationen (vermutlich nicht nötig)

---

## Environment Variables

- TZ (Default: Europe/Berlin)
- PARTNER_A_NAME (Default: Nico)
- PARTNER_B_NAME (Default: Nena)
- DB_PATH (Default: /data/app.db)
- PORT (Default: 3000)

---

## Deployment

- Dockerfile (ein Stage reicht; Node Alpine Runtime + system packages für better-sqlite3 prebuild)
- Compose:
  - Service app
    - Ports: 3000
    - Volumes: ./data:/data
    - Env: TZ, PARTNER_*, DB_PATH
- NPM (Proxy):
  - Subdomain, SSL (ohne App-Änderungen)
  - Hinweis: Ohne Auth nur im vertrauenswürdigen Netz betreiben oder IP-Restriktion nutzen; SSO siehe optionale Phase

Healthcheck: curl /health → 200

---

## Phasen & Erfolgskriterien

### Phase 1 – MVP (Startseite + /today + SQLite)
- Implementierung
  - DB-Init, heute()-Helper (TZ), Express-Routen: /, /health, POST /today
  - EJS-Views: layout + index (Buttons, Anzeige)
  - Minimaltests: POST /today → 303 Redirect; GET / → Gewinner-Anzeige
- Success (Automatisiert)
  - Tests grün (node:test oder vitest + supertest)
  - Node startet ohne Fehler; /health 200
- Success (Manuell)
  - Buttons funktionieren mobil; Gewinner persistiert; Neustart überlebt (Volume)

### Phase 2 – History & Stats
- Routen: GET /history, GET /stats?range=30d
- View: history.ejs (letzte N Tage, Summen)
- Tests für Range/Statistik

### Phase 3 – Docker & Deployment
- Dockerfile, docker-compose.yml, README mit Run-Kommandos
- Healthcheck dokumentiert; NPM-Konfiguration kurz beschrieben

### Phase 4 – Politur (optional)
- Kleines Rate Limiting (z. B. express-rate-limit)
- 304/Cache-Header für statische Assets
- Verbesserte Fehlermeldungen, Basic-Analytics (Console)

---

### Phase 5 – SSO (optional)
- Ziel: Schutz per Single Sign-On ohne App-internes User-Management
- Optionen
  - Authelia als Identity-Provider (Self-Hosted) hinter NPM via ForwardAuth/auth_request
  - OAuth2-Proxy (oder Traefik ForwardAuth) mit OIDC-Anbieter (z. B. GitHub/Google/Keycloak)
- Umsetzung (high-level)
  - NPM: Proxy-Host → Advanced Config/Custom Nginx Snippets für auth_request/forward_auth
  - Auth-Proxy: Session-Cookies, „eingeloggt bleiben“ möglich, Whitelist der Nutzer
  - App: unverändert; alle Routen geschützt durch vorgelagerten Proxy
- Erfolgskriterien
  - Nicht angemeldet: Zugriff auf „/“ und „/today“ wird geblockt (401/302 zum Login)
  - Nach Login: Zugriff ohne erneute Passwortabfrage (Session-Cookie), /health weiterhin erreichbar (optional)
  - Logout/Session-Expiry verhalten sich erwartungskonform

## Teststrategie (knapp)

- Unit: todayDate(TZ) – DST/Übergang (z. B. 23:30 UTC ~ 01:30 Berlin)
- API: /today Validierung, Upsert-Idempotenz, /health
- Integration: Temp-DB-Datei pro Testlauf im tmp-Verzeichnis
- E2E (manuell): Klickpfad Button → Redirect → Anzeige

---

## Risiken & Gegenmaßnahmen

- TZ/DST-Fehler → Utility-Funktion mit Tests, date-fns-tz verwenden
- better-sqlite3 Build/Alpine → passendes Base-Image (glibc oder musl-kompatibel) nutzen; zur Not ubuntu-slim
- Datenkorruption bei abruptem Stop → WAL-Modus, Volume auf stabilem Storage

---

## Nichtziel (bewusst weggelassen)

- Kein Frontend-Framework (kein Vue/React/Tailwind-Build)
- Keine komplexe User-/Rollenlogik
- Keine externe DB (PG) im MVP

---

## Nächste Schritte

- Wenn gewünscht, setze ich Phase 1 direkt um: minimale Server-Struktur, Views, DB-Init, Tests und Compose/Dockerfile-Skelett. Danach kurzer Review, dann History/Stats.
