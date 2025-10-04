import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, upsertToday, getToday, ensureSchema } from './services/db.js';
import { todayDate, nowUtcMs } from './utils/time.js';
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
  res.render('index', {
    title: 'LuvUMore',
    todayDate: d,
    winner: today?.winner || null,
    names: { a: PARTNER_A, b: PARTNER_B },
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
