# LuvUMore

Minimal web app to record a daily winner between two partners (Nico/Nena). No SPA, server-rendered HTML, SQLite storage.

- Implementation Plan: see `plan.md`

## Quick start

Prerequisites: Node 18+.

- Install deps: npm install
- Run server: npm start
- Visit: http://localhost:3000

Environment variables (optional):
- TZ (default Europe/Berlin)
- PARTNER_A_NAME (default Nico)
- PARTNER_B_NAME (default Nena)
- DB_PATH (default /data/app.db)
- PORT (default 3000)

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
