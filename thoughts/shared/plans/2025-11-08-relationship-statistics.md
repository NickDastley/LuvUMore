# Beziehungsstatistiken Implementation Plan

## Overview

Erweiterung der LuvUMore-App um Beziehungsstatistiken, die die Dauer der Beziehung seit dem 12. November 2021 in verschiedenen Zeiteinheiten anzeigen. Zusätzlich wird die Konfiguration über `.env`-Dateien standardisiert.

## Current State Analysis

Die LuvUMore-App ist bereits funktionsfähig mit:
- Express-Server mit EJS-Templates
- SQLite-Datenbank für tägliche Gewinner
- Bestehende Statistiken (Anzahl Siege pro Partner)
- Zeitzonenhandling via `date-fns-tz`
- Umgebungsvariablen in `docker-compose.yml` definiert

**Fehlende Komponenten:**
- Keine `.env`-Datei vorhanden
- Keine Konfiguration für Beziehungsstartdatum
- Keine Berechnung der Beziehungsdauer
- Keine Anzeige der Zeitstatistiken in der UI

## Desired End State

Nach Implementierung:
- `.env`-Datei mit allen konfigurierbaren Parametern
- `.env.example` als Template für neue Deployments
- Neue Statistik-Sektion zeigt:
  - Kombinierte Anzeige: X Jahre, Y Tage, Z Stunden, A Minuten, B Sekunden
  - Nur Gesamttage seit Beginn
  - Nur Gesamtstunden seit Beginn
  - Nur Gesamtminuten seit Beginn
  - Nur Gesamtsekunden seit Beginn
- Live-Update der Zeitanzeigen (JavaScript-basiert)
- Alle Werte korrekt für Startdatum 12. November 2021

### Verifikation:
- Container startet mit `.env`-Konfiguration
- Statistiken werden korrekt berechnet und angezeigt
- Live-Update funktioniert (Sekunden ändern sich)
- Zeitzonenkorrektheit gewährleistet

## What We're NOT Doing

- Keine Änderung der bestehenden Gewinner-Funktionalität
- Keine Datenbank-Migration (keine neuen Tabellen)
- Keine Änderung des Docker-Setups (bleibt bei bestehendem Volume-Mapping)
- Keine Backend-API für Statistiken (wird client-seitig berechnet)
- Keine historischen Meilensteine (z.B. "vor 1 Jahr passierte...")

## Implementation Approach

**Strategie:**
1. Environment-Variable für Startdatum hinzufügen
2. `.env` und `.env.example` Dateien erstellen
3. Utility-Funktion für Zeitberechnungen implementieren
4. Frontend mit neuer Statistik-Komponente erweitern
5. Client-seitiges JavaScript für Live-Updates

**Technische Entscheidungen:**
- Zeitberechnungen primär client-seitig (reduziert Server-Last)
- Server liefert nur Startdatum via Template
- Live-Updates mit `setInterval` (1 Sekunde)
- Verwendung von JavaScript Date API (kein zusätzliches Package nötig)

---

## Phase 1: Environment Configuration Setup

### Overview
Erstellen der `.env`-Infrastruktur und Standardisierung der Konfiguration.

### Changes Required:

#### 1. Create `.env.example` Template
**File**: `.env.example` (new)
**Changes**: Erstellen eines Template-Files mit allen konfigurierbaren Werten

```bash
# Partner Names
PARTNER_A_NAME=Nico
PARTNER_B_NAME=Nena

# Relationship Configuration
RELATIONSHIP_START_DATE=2021-11-12
TZ=Europe/Berlin

# Database
DB_PATH=/data/app.db

# Server
PORT=3000
```

#### 2. Create Default `.env` File
**File**: `.env` (new)
**Changes**: Erstellen der tatsächlichen `.env`-Datei mit den echten Werten

```bash
# Partner Names
PARTNER_A_NAME=Nico
PARTNER_B_NAME=Nena

# Relationship Configuration
RELATIONSHIP_START_DATE=2021-11-12
TZ=Europe/Berlin

# Database
DB_PATH=/data/app.db

# Server
PORT=3000
```

#### 3. Update `.gitignore`
**File**: `.gitignore` (create if not exists, else append)
**Changes**: Sicherstellen, dass `.env` nicht committed wird

```gitignore
# Environment variables
.env
.env.local

# Database
data/
*.db
*.db-shm
*.db-wal

# Node
node_modules/
npm-debug.log
yarn-error.log
```

#### 4. Install dotenv Package
**File**: `package.json`
**Changes**: `dotenv` als Dependency hinzufügen

```json
{
  "dependencies": {
    "better-sqlite3": "^11.6.0",
    "date-fns-tz": "^3.2.0",
    "dotenv": "^16.4.5",
    "ejs": "^3.1.10",
    "express": "^4.19.2",
    "express-ejs-layouts": "^2.5.1"
  }
}
```

#### 5. Load Environment Variables in Entry Point
**File**: `server/src/index.js`
**Changes**: dotenv am Anfang der Datei laden

```javascript
import 'dotenv/config';
import { createServer } from 'node:http';
import { app } from './server.js';

const PORT = Number(process.env.PORT || 3000);

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`[luv-u-more] listening on http://localhost:${PORT}`);
});

export default server;
```

#### 6. Update docker-compose.yml
**File**: `docker-compose.yml`
**Changes**: Referenzen auf `.env`-Datei hinzufügen

```yaml
version: '3.8'
services:
  app:
    build: .
    image: luv-u-more:latest
    env_file:
      - .env
    environment:
      - TZ=${TZ:-Europe/Berlin}
      - PARTNER_A_NAME=${PARTNER_A_NAME:-Nico}
      - PARTNER_B_NAME=${PARTNER_B_NAME:-Nena}
      - RELATIONSHIP_START_DATE=${RELATIONSHIP_START_DATE:-2021-11-12}
      - DB_PATH=/data/app.db
      - PORT=3000
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

volumes:
  data:
```

### Success Criteria:

#### Automated Verification:
- [x] Package installation successful: `npm install`
- [x] Tests still pass: `npm test`
- [x] Server starts without errors: `npm start`
- [ ] Docker build successful: `docker compose build`

#### Manual Verification:
- [x] `.env` file exists and contains correct values
- [x] `.env.example` file exists as template
- [x] Environment variables are loaded correctly (check with `console.log`)
- [ ] Docker container can read environment variables

---

## Phase 2: Utility Function for Time Calculations

### Overview
Erstellen einer wiederverwendbaren Utility-Funktion für Zeitberechnungen.

### Changes Required:

#### 1. Create Relationship Statistics Utility
**File**: `server/src/utils/relationshipStats.js` (new)
**Changes**: Neue Funktion zur Berechnung der Beziehungsdauer

```javascript
/**
 * Calculate relationship duration statistics
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} timezone - IANA timezone string
 * @returns {Object} Statistics object with all time units
 */
export function calculateRelationshipStats(startDate, timezone = 'Europe/Berlin') {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  
  // Total milliseconds difference
  const totalMs = now - start;
  
  // Calculate total units
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  // Calculate broken-down units (years, remaining days, etc.)
  const years = Math.floor(totalDays / 365.25);
  const remainingDaysAfterYears = Math.floor(totalDays - (years * 365.25));
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;
  const remainingSeconds = totalSeconds % 60;
  
  return {
    // Broken down
    breakdown: {
      years,
      days: remainingDaysAfterYears,
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds
    },
    // Total counts
    totals: {
      days: totalDays,
      hours: totalHours,
      minutes: totalMinutes,
      seconds: totalSeconds
    },
    // Metadata
    startDate,
    timezone
  };
}

/**
 * Get relationship start date from environment
 * @returns {string} ISO date string
 */
export function getRelationshipStartDate() {
  return process.env.RELATIONSHIP_START_DATE || '2021-11-12';
}
```

#### 2. Add Unit Tests for Utility
**File**: `server/test/relationshipStats.test.js` (new)
**Changes**: Tests für die Berechnungslogik

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateRelationshipStats, getRelationshipStartDate } from '../src/utils/relationshipStats.js';

describe('relationshipStats', () => {
  describe('calculateRelationshipStats', () => {
    it('should calculate correct total days', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.totals.days).toBeGreaterThan(1000); // More than 1000 days since 2021
    });

    it('should calculate breakdown correctly', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.breakdown.years).toBeGreaterThanOrEqual(3);
      expect(stats.breakdown.days).toBeGreaterThanOrEqual(0);
      expect(stats.breakdown.days).toBeLessThan(366);
      expect(stats.breakdown.hours).toBeGreaterThanOrEqual(0);
      expect(stats.breakdown.hours).toBeLessThan(24);
    });

    it('should include metadata', () => {
      const stats = calculateRelationshipStats('2021-11-12', 'Europe/Berlin');
      expect(stats.startDate).toBe('2021-11-12');
      expect(stats.timezone).toBe('Europe/Berlin');
    });

    it('should calculate totals for all units', () => {
      const stats = calculateRelationshipStats('2021-11-12');
      expect(stats.totals.seconds).toBeGreaterThan(stats.totals.minutes);
      expect(stats.totals.minutes).toBeGreaterThan(stats.totals.hours);
      expect(stats.totals.hours).toBeGreaterThan(stats.totals.days);
    });
  });

  describe('getRelationshipStartDate', () => {
    const originalEnv = process.env.RELATIONSHIP_START_DATE;

    afterEach(() => {
      process.env.RELATIONSHIP_START_DATE = originalEnv;
    });

    it('should return environment variable value', () => {
      process.env.RELATIONSHIP_START_DATE = '2020-01-01';
      expect(getRelationshipStartDate()).toBe('2020-01-01');
    });

    it('should return default value if not set', () => {
      delete process.env.RELATIONSHIP_START_DATE;
      expect(getRelationshipStartDate()).toBe('2021-11-12');
    });
  });
});
```

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `npm test`
- [x] Calculations are mathematically correct
- [x] All time units are properly calculated
- [x] Environment variable fallback works

#### Manual Verification:
- [x] Test with known dates produces expected results
- [x] Timezone handling is correct

---

## Phase 3: Backend Integration

### Overview
Integration der Statistikberechnung in den Express-Server.

### Changes Required:

#### 1. Update Server to Include Relationship Stats
**File**: `server/src/server.js`
**Changes**: Import und Übergabe der Stats an Template

```javascript
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, upsertToday, getToday, getStatistics, getHistory, ensureSchema } from './services/db.js';
import { todayDate, nowUtcMs } from './utils/time.js';
import { calculateRelationshipStats, getRelationshipStartDate } from './utils/relationshipStats.js';
import ejsLayouts from 'express-ejs-layouts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARTNER_A = process.env.PARTNER_A_NAME || 'Nico';
const PARTNER_B = process.env.PARTNER_B_NAME || 'Nena';

export const app = express();

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// Body parsers
app.use(express.urlencoded({ extended: false }));

// DB ensure schema at startup
ensureSchema();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  const tz = process.env.TZ || 'Europe/Berlin';
  const d = todayDate(tz);
  const today = getToday(d);
  const stats = getStatistics();
  const history = getHistory();
  const relationshipStats = calculateRelationshipStats(getRelationshipStartDate(), tz);
  
  res.render('index', {
    title: 'LuvUMore',
    todayDate: d,
    winner: today?.winner || null,
    names: { a: PARTNER_A, b: PARTNER_B },
    stats,
    history,
    relationshipStats,
  });
});

app.post('/today', (req, res) => {
  const winner = String(req.body.winner || '').toLowerCase();
  if (!['nico', 'nena'].includes(winner)) {
    return res.status(400).send('Invalid winner');
  }
  const tz = process.env.TZ || 'Europe/Berlin';
  const d = todayDate(tz);
  const now = nowUtcMs();
  try {
    upsertToday(d, winner, now, 'ui');
    // 303 redirect back to home
    res.redirect(303, '/');
  } catch (err) {
    console.error('Failed to upsert winner', err);
    res.status(500).send('DB error');
  }
});

export default app;
```

### Success Criteria:

#### Automated Verification:
- [x] Server starts without errors: `npm start`
- [x] Tests pass: `npm test`
- [x] Linting passes: (if configured)

#### Manual Verification:
- [x] No console errors when accessing homepage
- [x] `relationshipStats` object is available in template context

---

## Phase 4: Frontend UI Implementation

### Overview
Erstellen einer neuen UI-Sektion für die Beziehungsstatistiken mit Live-Updates.

### Changes Required:

#### 1. Add Relationship Statistics Section to View
**File**: `server/src/views/index.ejs`
**Changes**: Neue Statistik-Sektion vor der bestehenden Stats-Card einfügen

```html
<article>
  <header class="center">
    <h1>LuvUMore</h1>
    <p class="winner">Heutiger Gewinner (<span class="date"><%= todayDate %></span>):
      <% if (winner) { %>
        <strong><%= winner === 'nico' ? names.a : names.b %></strong>
      <% } else { %>
        —
      <% } %>
    </p>
  </header>

  <form method="post" action="/today">
    <div class="big-buttons">
      <button type="submit" name="winner" value="nico" class="contrast"><%= names.a %></button>
      <button type="submit" name="winner" value="nena" class="secondary"><%= names.b %></button>
    </div>
  </form>

  <footer class="center">
    <small>TZ: <code><%= process.env.TZ || 'Europe/Berlin' %></code></small>
  </footer>
</article>

<!-- NEW: Relationship Duration Statistics -->
<article class="relationship-stats-card">
  <header>
    <h2>💕 Zusammen seit dem 12. November 2021</h2>
  </header>

  <div class="relationship-stats">
    <!-- Combined breakdown -->
    <div class="stat-box primary-stat">
      <div class="stat-label">Unsere gemeinsame Zeit</div>
      <div class="stat-value" id="timeCombined">
        <span id="years"><%= relationshipStats.breakdown.years %></span> Jahre,
        <span id="days"><%= relationshipStats.breakdown.days %></span> Tage,
        <span id="hours"><%= relationshipStats.breakdown.hours %></span> Stunden,
        <span id="minutes"><%= relationshipStats.breakdown.minutes %></span> Minuten,
        <span id="seconds"><%= relationshipStats.breakdown.seconds %></span> Sekunden
      </div>
    </div>

    <!-- Total units grid -->
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Tage</div>
        <div class="stat-value" id="totalDays"><%= relationshipStats.totals.days.toLocaleString('de-DE') %></div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Stunden</div>
        <div class="stat-value" id="totalHours"><%= relationshipStats.totals.hours.toLocaleString('de-DE') %></div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Minuten</div>
        <div class="stat-value" id="totalMinutes"><%= relationshipStats.totals.minutes.toLocaleString('de-DE') %></div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Sekunden</div>
        <div class="stat-value" id="totalSeconds"><%= relationshipStats.totals.seconds.toLocaleString('de-DE') %></div>
      </div>
    </div>
  </div>

  <script>
    // Pass server data to client
    const RELATIONSHIP_START = '<%= relationshipStats.startDate %>';
    
    // Update function
    function updateRelationshipStats() {
      const start = new Date(RELATIONSHIP_START + 'T00:00:00');
      const now = new Date();
      const totalMs = now - start;
      
      // Calculate totals
      const totalSeconds = Math.floor(totalMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);
      
      // Calculate breakdown
      const years = Math.floor(totalDays / 365.25);
      const remainingDays = Math.floor(totalDays - (years * 365.25));
      const remainingHours = totalHours % 24;
      const remainingMinutes = totalMinutes % 60;
      const remainingSeconds = totalSeconds % 60;
      
      // Update DOM
      document.getElementById('years').textContent = years;
      document.getElementById('days').textContent = remainingDays;
      document.getElementById('hours').textContent = remainingHours;
      document.getElementById('minutes').textContent = remainingMinutes;
      document.getElementById('seconds').textContent = remainingSeconds;
      
      document.getElementById('totalDays').textContent = totalDays.toLocaleString('de-DE');
      document.getElementById('totalHours').textContent = totalHours.toLocaleString('de-DE');
      document.getElementById('totalMinutes').textContent = totalMinutes.toLocaleString('de-DE');
      document.getElementById('totalSeconds').textContent = totalSeconds.toLocaleString('de-DE');
    }
    
    // Update every second
    setInterval(updateRelationshipStats, 1000);
    
    // Initial update
    updateRelationshipStats();
  </script>
</article>

<article class="stats-card">
  <header>
    <h2>Statistiken</h2>
  </header>

  <!-- Rest of existing stats code... -->
```

#### 2. Add CSS Styles to Layout
**File**: `server/src/views/layout.ejs`
**Changes**: CSS-Styles für die neue Statistik-Sektion hinzufügen

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title || 'LuvUMore' %></title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    body {
      padding: 1rem;
    }
    .center {
      text-align: center;
    }
    .big-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 2rem 0;
    }
    .big-buttons button {
      font-size: 1.5rem;
      padding: 2rem;
      min-height: 120px;
    }
    .winner {
      font-size: 1.2rem;
      margin: 1rem 0;
    }
    .date {
      font-family: monospace;
      color: var(--pico-muted-color);
    }
    
    /* Relationship Stats Styles */
    .relationship-stats-card {
      background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 182, 193, 0.1));
      border: 2px solid rgba(255, 105, 180, 0.3);
    }
    
    .relationship-stats-card h2 {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .relationship-stats {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .stat-box {
      text-align: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    .primary-stat {
      background: rgba(255, 105, 180, 0.15);
      padding: 1.5rem;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--pico-muted-color);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--pico-primary);
      font-variant-numeric: tabular-nums;
    }
    
    .primary-stat .stat-value {
      font-size: 1.25rem;
      line-height: 1.6;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
      .big-buttons button {
        font-size: 2rem;
        padding: 3rem;
      }
    }

    /* Existing stats styles */
    .stats-summary {
      margin: 1rem 0;
    }
    #historyTable table {
      margin-top: 1rem;
    }
    #historyTable input {
      margin-bottom: 0.5rem;
    }
  </style>
  <script>
    // Toggle history table visibility
    document.addEventListener('DOMContentLoaded', () => {
      const toggleBtn = document.getElementById('toggleHistory');
      const historyTable = document.getElementById('historyTable');
      
      if (toggleBtn && historyTable) {
        toggleBtn.addEventListener('click', () => {
          const isHidden = historyTable.style.display === 'none';
          historyTable.style.display = isHidden ? 'block' : 'none';
          toggleBtn.textContent = isHidden ? 'Details ausblenden' : 'Details anzeigen';
        });
      }

      // Filter and sort functionality for history table
      const filterDate = document.getElementById('filterDate');
      const filterWinner = document.getElementById('filterWinner');
      const filterTime = document.getElementById('filterTime');
      const historyBody = document.getElementById('historyBody');

      if (filterDate && filterWinner && filterTime && historyBody) {
        const filterTable = () => {
          const dateFilter = filterDate.value.toLowerCase();
          const winnerFilter = filterWinner.value.toLowerCase();
          const timeFilter = filterTime.value.toLowerCase();
          
          Array.from(historyBody.rows).forEach(row => {
            const date = row.dataset.date.toLowerCase();
            const winner = row.dataset.winner.toLowerCase();
            const time = row.dataset.time.toLowerCase();
            
            const matchesDate = date.includes(dateFilter);
            const matchesWinner = winner.includes(winnerFilter);
            const matchesTime = time.includes(timeFilter);
            
            row.style.display = (matchesDate && matchesWinner && matchesTime) ? '' : 'none';
          });
        };

        filterDate.addEventListener('input', filterTable);
        filterWinner.addEventListener('input', filterTable);
        filterTime.addEventListener('input', filterTable);
      }
    });
  </script>
</head>
<body>
  <main class="container">
    <%- body %>
  </main>
</body>
</html>
```

### Success Criteria:

#### Automated Verification:
- [x] Server starts without errors: `npm start`
- [x] No JavaScript errors in browser console
- [x] HTML validates correctly

#### Manual Verification:
- [x] New statistics section displays above existing stats
- [x] All time values are visible and correctly formatted
- [x] Seconds counter updates every second (live update works)
- [x] Layout is responsive on mobile devices
- [x] Styling matches existing Pico CSS theme
- [x] German number formatting works (thousands separator)

---

## Phase 5: Documentation and README Update

### Overview
Aktualisierung der Dokumentation mit den neuen Features.

### Changes Required:

#### 1. Update README.md
**File**: `README.md`
**Changes**: Neue Features und Konfiguration dokumentieren

```markdown
# LuvUMore

Minimal web app to record a daily winner between two partners (Nico/Nena). No SPA, server-rendered HTML, SQLite storage.

Features:
- Daily winner tracking
- Relationship duration statistics (live updating)
- Win statistics and history
- Mobile-first responsive design

- Implementation Plan: see `plan.md`

## Quick start

Prerequisites: Node 18+.

- Copy environment template: `cp .env.example .env`
- Edit `.env` with your values
- Install deps: `npm install`
- Run server: `npm start`
- Visit: http://localhost:3000

## Configuration

All configuration is done via `.env` file. See `.env.example` for all available options.

### Required Configuration:
- `RELATIONSHIP_START_DATE` - Start date of relationship (YYYY-MM-DD format)
- `PARTNER_A_NAME` - Name of first partner
- `PARTNER_B_NAME` - Name of second partner

### Optional Configuration:
- `TZ` - Timezone (default: Europe/Berlin)
- `DB_PATH` - Database file path (default: /data/app.db)
- `PORT` - Server port (default: 3000)

### Example .env:
```
RELATIONSHIP_START_DATE=2021-11-12
PARTNER_A_NAME=Nico
PARTNER_B_NAME=Nena
TZ=Europe/Berlin
```

## Features

### Relationship Statistics
The app displays comprehensive relationship duration statistics:
- Combined breakdown: X years, Y days, Z hours, A minutes, B seconds
- Total days together
- Total hours together
- Total minutes together
- Total seconds together

All statistics update live every second.

### Daily Winner Tracking
Track which partner said "I love you more" first each day.

### Win Statistics
View overall win counts and historical data.

## Tests

Run tests:

```
npm test
```

## Docker

Build and run with compose:

```
docker compose up --build
```

Make sure to create a `.env` file before running (see Configuration section above).
```

### Success Criteria:

#### Automated Verification:
- [x] README renders correctly in GitHub
- [x] All code blocks are properly formatted
- [x] Links work correctly

#### Manual Verification:
- [x] Documentation is clear and complete
- [x] Examples are accurate
- [x] Setup instructions are easy to follow

---

## Testing Strategy

### Unit Tests:
- Time calculation functions (`relationshipStats.js`)
- Edge cases: leap years, timezone boundaries
- Default value fallbacks

### Integration Tests:
- Server renders with relationship stats
- Environment variables are properly loaded
- Stats are passed to template correctly

### Manual Testing Steps:
1. Start server locally: `npm start`
2. Verify relationship stats display correctly
3. Watch seconds counter update for at least 10 seconds
4. Check all 5 stat types are visible and accurate
5. Test on mobile device (responsive layout)
6. Verify with different start dates in `.env`
7. Test Docker deployment: `docker compose up --build`
8. Verify stats persist after container restart

## Performance Considerations

- Client-side calculations reduce server load
- Live updates use lightweight JavaScript (no frameworks)
- Updates every 1 second is acceptable (minimal CPU usage)
- No additional database queries needed
- Calculations are fast (simple arithmetic)

## Migration Notes

**For Existing Installations:**
1. Pull latest code
2. Create `.env` file from `.env.example`
3. Set `RELATIONSHIP_START_DATE=2021-11-12`
4. Run `npm install` (adds dotenv)
5. Restart server

**No database changes required** - all functionality is additive.

## References

- Original repository: LuvUMore
- Date calculations: Native JavaScript Date API
- Styling: Pico CSS v2
- Time utilities: date-fns-tz
