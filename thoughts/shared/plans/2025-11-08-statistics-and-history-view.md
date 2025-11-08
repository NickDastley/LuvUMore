# Statistiken und History-Tabelle Implementation Plan

## Overview

Erweiterung der LuvUMore-Startseite um eine Statistik-Karte mit:
1. Gesamtstatistik (wer wie oft gewonnen hat)
2. Ausblendbare, filterbare und sortierbare Tabelle mit allen Gewinner-Einträgen
3. Vanilla JavaScript für Interaktivität (Toggle, Filter, Sortierung)

## Current State Analysis

**Existierender Code:**
- `server/src/server.js`: Express-App mit Routen `/`, `/health`, `POST /today`
- `server/src/services/db.js`: SQLite-Funktionen `getToday()`, `upsertToday()`, `ensureSchema()`
- `server/src/views/index.ejs`: Hauptseite mit zwei Buttons für Nico/Nena
- `server/src/views/layout.ejs`: Basis-Layout mit Pico.css CDN
- Datenbank: `winners` Tabelle mit Feldern: `date`, `winner`, `recorded_at`, `source`, `note`

**Was fehlt:**
- DB-Funktionen für Statistik-Aggregation und vollständige History
- Statistik-Anzeige im Frontend
- Tabelle mit Filter- und Sortier-Funktionalität
- Minimales JavaScript für Interaktivität

## Desired End State

Nach Implementierung:
- Startseite zeigt unter den Buttons eine neue Karte "Statistiken"
- In der Karte: Übersicht "Nico: X Siege, Nena: Y Siege"
- Button "Details anzeigen/verbergen" togglet eine Tabelle
- Tabelle zeigt alle Einträge mit Spalten: Datum, Gewinner, Uhrzeit
- Jede Spalte hat ein Filter-Input-Feld (text-basiert)
- Spaltenüberschriften sind klickbar für Sortierung (auf-/absteigend)
- Standard-Sortierung: Datum absteigend (neueste zuerst)
- Alles ohne externe JavaScript-Bibliotheken, nur Vanilla JS

### Verification:
- npm test zeigt grüne Tests für neue Endpunkte
- Manuelle Prüfung: Statistik korrekt, Tabelle filterbar/sortierbar, Toggle funktioniert

## What We're NOT Doing

- Keine komplexen Date-Range-Filter (nur einfache Text-Filter)
- Keine Pagination (okay für einige hundert Einträge)
- Keine persistenten Filter/Sortier-Einstellungen (Session-basiert)
- Keine Export-Funktion (CSV/Excel)
- Keine Charts/Grafiken (nur Text-Statistik)

## Implementation Approach

**Strategie:**
1. Backend: Neue DB-Funktionen für Stats und History
2. Backend: Daten in bestehenden `/`-Route mitgeben
3. Frontend: EJS-Template erweitern (neue Karte, Tabelle)
4. Frontend: Minimales Vanilla JS für Toggle, Filter, Sortierung
5. Tests: Neue DB-Funktionen testen

**Tech-Stack bleibt gleich:**
- Server-Side Rendering (EJS)
- Pico.css für Styling
- Vanilla JavaScript (inline im Template oder als kleines Script)

---

## Phase 1: Backend – DB-Funktionen & Route erweitern

### Overview
Neue Datenbankfunktionen für Statistik und History hinzufügen, bestehende Route `/` erweitern.

### Changes Required:

#### 1. DB-Service erweitern
**File**: `server/src/services/db.js`
**Changes**: Zwei neue Funktionen hinzufügen

```javascript
// Nach getToday() hinzufügen:

/**
 * Get overall statistics (total wins per partner)
 * @returns {{ winner: string, count: number }[]}
 */
export function getStatistics() {
  const stmt = db.prepare(`
    SELECT winner, COUNT(*) as count 
    FROM winners 
    GROUP BY winner 
    ORDER BY count DESC
  `);
  return stmt.all();
}

/**
 * Get full history of all winners
 * @returns {{ date: string, winner: string, recordedAt: number, source: string, note: string|null }[]}
 */
export function getHistory() {
  const stmt = db.prepare(`
    SELECT date, winner, recorded_at as recordedAt, source, note 
    FROM winners 
    ORDER BY date DESC
  `);
  return stmt.all();
}
```

#### 2. Route `/` erweitern
**File**: `server/src/server.js`
**Changes**: Import der neuen Funktionen und Daten ans Template übergeben

```javascript
// Import-Zeile ändern:
import { db, upsertToday, getToday, getStatistics, getHistory, ensureSchema } from './services/db.js';

// In der GET / Route ändern:
app.get('/', (req, res) => {
  const tz = process.env.TZ || 'Europe/Berlin';
  const d = todayDate(tz);
  const today = getToday(d);
  const stats = getStatistics(); // NEU
  const history = getHistory();  // NEU
  
  res.render('index', {
    title: 'LuvUMore',
    todayDate: d,
    winner: today?.winner || null,
    names: { a: PARTNER_A, b: PARTNER_B },
    stats,    // NEU
    history,  // NEU
  });
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Unit tests für `getStatistics()` und `getHistory()` bestehen: `npm test`
- [ ] Server startet ohne Fehler: `npm start`
- [ ] GET `/` liefert 200 und rendert korrekt

#### Manual Verification:
- [ ] `/` zeigt keine Fehler in Browser-Konsole
- [ ] Stats und History werden korrekt ans Template übergeben (prüfbar via Template-Code)

---

## Phase 2: Frontend – Statistik-Karte & Tabelle (HTML/EJS)

### Overview
EJS-Template erweitern: Neue Karte mit Statistik-Übersicht, Toggle-Button und History-Tabelle.

### Changes Required:

#### 1. Index-View erweitern
**File**: `server/src/views/index.ejs`
**Changes**: Nach dem `</form>` Tag und vor `<footer>` die neue Statistik-Sektion einfügen

```html
<!-- Nach </form>, vor <footer> einfügen: -->

<article class="stats-card">
  <header>
    <h2>Statistiken</h2>
  </header>

  <div class="stats-summary">
    <% if (stats && stats.length > 0) { %>
      <p>
        <% stats.forEach((s, idx) => { %>
          <strong><%= s.winner === 'nico' ? names.a : names.b %></strong>: <%= s.count %> <%= s.count === 1 ? 'Sieg' : 'Siege' %><%= idx < stats.length - 1 ? ', ' : '' %>
        <% }); %>
      </p>
    <% } else { %>
      <p>Noch keine Einträge vorhanden.</p>
    <% } %>
  </div>

  <button type="button" id="toggleHistory" class="outline">Details anzeigen</button>

  <div id="historyTable" style="display: none; margin-top: 1rem;">
    <% if (history && history.length > 0) { %>
      <input type="text" id="filterDate" placeholder="Datum filtern..." style="margin-bottom: 0.5rem;" />
      <input type="text" id="filterWinner" placeholder="Gewinner filtern..." style="margin-bottom: 0.5rem;" />
      <input type="text" id="filterTime" placeholder="Uhrzeit filtern..." style="margin-bottom: 1rem;" />
      
      <table role="grid">
        <thead>
          <tr>
            <th data-sort="date" style="cursor: pointer;">Datum ▼</th>
            <th data-sort="winner" style="cursor: pointer;">Gewinner</th>
            <th data-sort="time" style="cursor: pointer;">Uhrzeit</th>
          </tr>
        </thead>
        <tbody id="historyBody">
          <% history.forEach(entry => { %>
            <tr data-date="<%= entry.date %>" data-winner="<%= entry.winner %>" data-time="<%= new Date(entry.recordedAt).toLocaleTimeString('de-DE') %>">
              <td><%= entry.date %></td>
              <td><%= entry.winner === 'nico' ? names.a : names.b %></td>
              <td><%= new Date(entry.recordedAt).toLocaleTimeString('de-DE') %></td>
            </tr>
          <% }); %>
        </tbody>
      </table>
    <% } else { %>
      <p>Keine Einträge vorhanden.</p>
    <% } %>
  </div>
</article>
```

#### 2. Layout CSS erweitern
**File**: `server/src/views/layout.ejs`
**Changes**: Zusätzliche Styles in den `<style>`-Block

```css
/* In <style> nach den bestehenden Regeln einfügen: */
.stats-card { margin-top: 2rem; }
.stats-summary { font-size: 1.1rem; margin-bottom: 1rem; }
#historyTable table { font-size: 0.9rem; }
#historyTable input[type="text"] { font-size: 0.85rem; padding: 0.4rem; }
```

### Success Criteria:

#### Automated Verification:
- [ ] Server startet und rendert ohne Fehler: `npm start`
- [ ] HTML validiert (keine offensichtlichen Syntax-Fehler)

#### Manual Verification:
- [ ] Statistik-Karte erscheint unter den Buttons
- [ ] "Details anzeigen" Button ist sichtbar
- [ ] Tabelle ist initial versteckt
- [ ] Filter-Inputs und Tabelle rendern korrekt

---

## Phase 3: Frontend – JavaScript für Interaktivität

### Overview
Vanilla JavaScript hinzufügen für Toggle, Filter und Sortierung der Tabelle.

### Changes Required:

#### 1. JavaScript-Block im Layout
**File**: `server/src/views/layout.ejs`
**Changes**: Vor `</body>` ein `<script>`-Block einfügen

```html
<!-- Vor </body> einfügen: -->
<script>
  // Toggle History Table
  const toggleBtn = document.getElementById('toggleHistory');
  const historyTable = document.getElementById('historyTable');
  
  if (toggleBtn && historyTable) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = historyTable.style.display === 'none';
      historyTable.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Details verbergen' : 'Details anzeigen';
    });
  }

  // Filter Functionality
  const filterDate = document.getElementById('filterDate');
  const filterWinner = document.getElementById('filterWinner');
  const filterTime = document.getElementById('filterTime');
  const historyBody = document.getElementById('historyBody');

  function applyFilters() {
    if (!historyBody) return;
    const rows = historyBody.querySelectorAll('tr');
    const dateVal = filterDate?.value.toLowerCase() || '';
    const winnerVal = filterWinner?.value.toLowerCase() || '';
    const timeVal = filterTime?.value.toLowerCase() || '';

    rows.forEach(row => {
      const date = row.dataset.date?.toLowerCase() || '';
      const winner = row.dataset.winner?.toLowerCase() || '';
      const time = row.dataset.time?.toLowerCase() || '';

      const match = date.includes(dateVal) && winner.includes(winnerVal) && time.includes(timeVal);
      row.style.display = match ? '' : 'none';
    });
  }

  [filterDate, filterWinner, filterTime].forEach(input => {
    input?.addEventListener('input', applyFilters);
  });

  // Sort Functionality
  const tableHeaders = document.querySelectorAll('th[data-sort]');
  let currentSort = { column: 'date', order: 'desc' }; // Default: Datum absteigend

  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      const order = currentSort.column === column && currentSort.order === 'asc' ? 'desc' : 'asc';
      currentSort = { column, order };
      
      sortTable(column, order);
      updateSortIndicators(th, order);
    });
  });

  function sortTable(column, order) {
    if (!historyBody) return;
    const rows = Array.from(historyBody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
      let aVal = a.dataset[column] || '';
      let bVal = b.dataset[column] || '';
      
      // Für Datum: direkt String-Vergleich (YYYY-MM-DD)
      // Für Zeit: auch String-Vergleich (HH:MM:SS)
      if (order === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    rows.forEach(row => historyBody.appendChild(row));
  }

  function updateSortIndicators(activeHeader, order) {
    tableHeaders.forEach(th => {
      th.textContent = th.textContent.replace(/ [▲▼]/, '');
    });
    activeHeader.textContent += order === 'asc' ? ' ▲' : ' ▼';
  }
</script>
```

### Success Criteria:

#### Automated Verification:
- [ ] Keine JavaScript-Syntax-Fehler: Browser-Konsole bleibt leer
- [ ] Server startet: `npm start`

#### Manual Verification:
- [ ] Button "Details anzeigen" zeigt/versteckt Tabelle
- [ ] Button-Text ändert sich entsprechend
- [ ] Filter in allen drei Spalten funktioniert (Echtzeit)
- [ ] Klick auf Spaltenüberschrift sortiert auf-/absteigend
- [ ] Sortier-Indikatoren (▲▼) werden korrekt angezeigt
- [ ] Standard-Sortierung ist Datum absteigend (neueste oben)

---

## Phase 4: Tests erweitern

### Overview
Tests für neue DB-Funktionen hinzufügen.

### Changes Required:

#### 1. Tests für Statistics und History
**File**: `server/test/api.test.js`
**Changes**: Neue Test-Cases hinzufügen

```javascript
// Nach den bestehenden Tests einfügen:

import { getStatistics, getHistory } from '../src/services/db.js';

describe('Statistics and History', () => {
  it('getStatistics returns aggregated wins', () => {
    const stats = getStatistics();
    expect(Array.isArray(stats)).toBe(true);
    // Mit bestehenden Testdaten sollte mindestens ein Eintrag existieren
    if (stats.length > 0) {
      expect(stats[0]).toHaveProperty('winner');
      expect(stats[0]).toHaveProperty('count');
    }
  });

  it('getHistory returns all entries sorted by date desc', () => {
    const history = getHistory();
    expect(Array.isArray(history)).toBe(true);
    if (history.length > 1) {
      // Prüfen, dass neuere Einträge zuerst kommen
      expect(history[0].date >= history[1].date).toBe(true);
    }
  });

  it('GET / includes stats and history data', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    // Prüfen, dass die neuen Daten im HTML vorhanden sind
    expect(res.text).toContain('Statistiken');
  });
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Alle Tests bestehen: `npm test`
- [ ] Code Coverage bleibt stabil oder steigt

#### Manual Verification:
- [ ] Tests laufen ohne Timeout oder Crash

---

## Testing Strategy

### Unit Tests:
- `getStatistics()` – gibt korrekte Aggregation zurück
- `getHistory()` – gibt alle Einträge sortiert nach Datum DESC zurück
- Route `/` – enthält Stats und History im Response

### Integration Tests:
- Vollständiger Klickpfad: Button → POST /today → Redirect → Statistik aktualisiert

### Manual Testing Steps:
1. Startseite öffnen → Statistik-Karte sichtbar
2. "Details anzeigen" klicken → Tabelle erscheint
3. Filter testen: Datum, Gewinner, Uhrzeit (Text-Eingabe)
4. Sortierung testen: Klick auf Spaltenüberschriften (auf-/absteigend)
5. Mehrere Gewinner speichern → Statistik aktualisiert sich nach Reload
6. Mobil-Ansicht prüfen (Responsive)

---

## Performance Considerations

- **Tabelle ohne Pagination**: Okay für ~1000 Einträge (Performance-Test bei Bedarf)
- **Client-Side Filter/Sort**: Schnell für kleine Datasets; bei >5000 Einträgen serverseitige Lösung erwägen
- **WAL-Mode SQLite**: Read-Performance bleibt hoch auch bei wachsender DB

---

## Migration Notes

- Keine Schema-Änderungen nötig (bestehende `winners`-Tabelle reicht)
- Bestehende Daten bleiben unverändert
- Abwärtskompatibel: alte Deployments funktionieren weiter (nur ohne Statistik-Anzeige)

---

## References

- Original Plan: `thoughts/plan-minimal.md` (Phase 2 – History & Stats)
- Bestehender Code:
  - `server/src/server.js:30-44` (GET / Route)
  - `server/src/services/db.js:34-53` (DB-Funktionen)
  - `server/src/views/index.ejs` (Template)
- Pico.css Docs: https://picocss.com/docs
