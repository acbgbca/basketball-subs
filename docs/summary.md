# Basketball Subs Application Summary

## Overview

Basketball Subs is a Progressive Web Application (PWA) built with React and TypeScript, designed to help basketball coaches efficiently track player participation, substitutions, and fouls during games. The application is optimized for mobile and desktop use, and supports offline functionality as a PWA. Navigation is managed using React Router's `HashRouter`.

## Key Features

- **Team Management**: Create, edit, and manage basketball teams and their rosters. Teams can be shared and imported.
- **Game Management**: Schedule and manage games, configure periods (2x20min halves or 4x10min quarters), and track which players are active for each game.
- **Substitution Tracking**: Record and edit player substitutions, including time in/out and seconds played, with a maximum of 5 players on the court at any time. Editing a substitution event updates all related substitution records to ensure data consistency.
- **Foul Tracking**: Log fouls per player, including period and time remaining.
- **Period Management**: Track periods, substitutions, and fouls for each period.
- **Statistics**: View player minutes, fouls, substitution history, and period-by-period stats.
- **Export/Share**: Teams and game data can be exported or shared.
- **Testing**: Comprehensive unit and end-to-end tests using Jest and Playwright.
- **Service Layer Architecture**: Core game logic (calculations and mutations) is implemented in a dedicated service layer (`src/services/gameService.ts`). This improves maintainability, testability, and separation of concerns between UI and business logic.
- **Modular UI Architecture**: The main game view (`GameView.tsx`) is now fully modular, with the following major UI sections and dialogs extracted into their own files:
  - `GameHeader.tsx`: Header, clock, and control buttons
  - `PlayerTable.tsx`: Player list and stats
  - `SubstitutionTable.tsx`: Substitution list and actions
  - `modals/EditSubstitutionModal.tsx`: Edit substitution dialog
  - `modals/EndPeriodModal.tsx`: End period confirmation dialog
  - `modals/SubstitutionModal.tsx`: Manage and edit substitutions dialog
  - `modals/FoulModal.tsx`: Record foul dialog


## Data Model (Summary)

- **Player**: `{ id, name, number }`
- **Team**: `{ id, name, players: Player[] }`
- **Game**: `{ id, date, team, opponent, players, periods, activePlayers, currentPeriod, isRunning, periodStartTime?, periodTimeElapsed? }`
- **Period**: `{ id, periodNumber, length, substitutions, fouls, subEvents }`
- **Substitution**: `{ id, player, timeInEvent, timeOutEvent, secondsPlayed, periodId }`
- **SubstitutionEvent**: `{ id, eventTime, periodId, subbedIn: Player[], playersOut: Player[] }` (can be edited; editing updates all related substitution records and active player list)
- **Foul**: `{ id, player, periodId, timeRemaining }`

## Technical Stack

- **Frontend**: React, TypeScript, React-Bootstrap
- **Routing**: React Router (HashRouter)
- **State/Storage**: IndexedDB via `idb` for offline data persistence
- **Testing**: Jest (unit), Playwright (e2e)
- **Build**: Webpack, Babel
- **PWA**: Service worker, manifest, offline support, and link capturing (shared team links open within the installed app)
- **Service Layer**: Game logic and calculations are handled in `src/services/gameService.ts`.
- **Component Structure**: Main game UI is split into modular components for maintainability and clarity.

## Navigation Structure

- `/teams` — List and manage teams
- `/teams/new` — Create a new team
- `/teams/:id` — View/edit a team
- `/games` — List and manage games
- `/games/new` — Create a new game
- `/games/:id` — View/manage a game (substitutions, fouls, stats)

## Key Requirements

- Track player participation and substitutions accurately
- Enforce basketball rules (max 5 players on court)
- Support both 2-period and 4-period game formats
- Allow for fill-in players not on the regular roster
- Provide clear, user-friendly UI for managing teams, games, and substitutions
- Support offline use and data persistence
- Enable data export and sharing
- Maintain up-to-date documentation for all data model and feature changes

## Documentation

- Data model and relationships are documented in `docs/model.md`
- User and developer instructions are in `README.md`
- Service layer logic is documented in `src/services/gameService.ts`
- UI component structure and modularization are reflected in this summary

---

This summary is intended for AI agents and developers to quickly understand the application's purpose, structure, and requirements for effective development and maintenance.
