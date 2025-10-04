import request from 'supertest';
import { app } from '../src/server.js';
import { db } from '../src/services/db.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('LuvUMore API', () => {
  beforeAll(() => {
    // Use in-memory DB for tests if DB_PATH not provided
    db.exec('DELETE FROM winners');
  });

  afterAll(() => {
    // close db
    try { db.close(); } catch {}
  });

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
