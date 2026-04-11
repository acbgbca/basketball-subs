# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run start       # Start webpack dev server at http://localhost:3000
npm run build       # Production build (outputs to /build)
```

### Unit Tests (Jest)
```bash
npm test                        # Run in watch mode
npm test -- --watchAll=false    # Run all tests once
npm test -- --coverage          # Run with coverage
npm test TeamOperations         # Run tests matching a pattern
```

### E2E Tests (Playwright)
```bash
npx playwright install --include-deps   # First-time setup
npm run test:e2e                        # Run all browsers
npm run test:e2e:ui                     # Interactive UI mode
npx playwright test e2e/team.spec.ts    # Single test file
npx playwright test e2e/team.spec.ts --project=chromium  # Single file, single browser
npx playwright show-report              # View HTML report after failure
```

## Architecture

PWA for basketball coaches to track player substitutions, fouls, and playing time. React 19 + TypeScript frontend with IndexedDB for offline-first persistence, deployed to GitHub Pages.

**Routing:** HashRouter (required for GitHub Pages static hosting). Routes: `/` → GameList, `/teams` → TeamList, `/games/new` → GameForm, `/games/:id` → GameView.

**Data layer:** All persistence goes through `src/services/db.ts` (IndexedDB via `idb`). Business logic lives in `src/services/gameService.ts` — components stay thin and call service functions.

**Key types** (defined in `src/types/index.ts`):
- `Game` holds `activePlayers[]`, `periods[]`, `currentPeriod`, timer state (`isRunning`, `periodStartTime`, `periodTimeElapsed`)
- `Period` holds `substitutions[]`, `fouls[]`, `subEvents[]`
- `SubstitutionEvent` records a moment-in-time swap: `subbedIn[]`, `playersOut[]`, `eventTime` (seconds remaining)
- `Substitution` links a player to their `timeInEvent`/`timeOutEvent` and computed `secondsPlayed`

**Main game interface** (`GameView.tsx` + `GameHeader.tsx`): timer precision is maintained via refs and timestamps, not interval-based counting. Max 5 players on court enforced in `gameService.ts`. Substitution edits cascade to update all related records and `activePlayers`.

**E2E page objects** in `e2e/pages/`: `Teams.ts`, `SetupGame.ts`, `RunGame.ts` — use these helpers when writing new Playwright tests.

**Build:** Webpack 5 with Babel + ts-loader. TypeScript strict mode is enabled (`tsconfig.json`).
