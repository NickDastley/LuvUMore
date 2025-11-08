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
