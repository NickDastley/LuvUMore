import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_LOCAL_DB = path.resolve(process.cwd(), 'data/app.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_LOCAL_DB;

// Ensure directory exists
const dir = path.dirname(DB_PATH);
try {
  fs.mkdirSync(dir, { recursive: true });
} catch (e) {
  // If directory creation fails, log once; DB open may still fail and surface clearly
  console.error('[db] failed to create dir', dir, e?.message);
}

export const db = new Database(DB_PATH);

export function ensureSchema() {
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS winners (
      date TEXT PRIMARY KEY,
      winner TEXT NOT NULL CHECK (winner in ('nico','nena')),
      recorded_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'ui',
      note TEXT NULL
    );
  `);
}

export function upsertToday(date, winner, recordedAt, source = 'ui', note = null) {
  const stmt = db.prepare(`
    INSERT INTO winners (date, winner, recorded_at, source, note)
    VALUES (@date, @winner, @recorded_at, @source, @note)
    ON CONFLICT(date) DO UPDATE SET
      winner=excluded.winner,
      recorded_at=excluded.recorded_at,
      source=excluded.source,
      note=excluded.note
  `);
  return stmt.run({ date, winner, recorded_at: recordedAt, source, note });
}

export function getToday(date) {
  const stmt = db.prepare('SELECT date, winner, recorded_at as recordedAt, source, note FROM winners WHERE date = ?');
  return stmt.get(date);
}

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
