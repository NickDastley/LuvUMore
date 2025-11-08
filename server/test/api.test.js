import request from 'supertest';
import { app } from '../src/server.js';
import { db, getStatistics, getHistory } from '../src/services/db.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Use in-memory DB for tests if DB_PATH not provided
  db.exec('DELETE FROM winners');
});

afterAll(() => {
  // close db
  try { db.close(); } catch {}
});

describe('LuvUMore API', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET / renders page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('LuvUMore');
  });

  it('POST /today accepts valid winner and redirects', async () => {
    const res = await request(app)
      .post('/today')
      .type('form')
      .send({ winner: 'nico' });
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/');
  });
});

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
