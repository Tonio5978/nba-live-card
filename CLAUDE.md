# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NBA Live Card** is a Home Assistant custom card (Lovelace plugin) that displays live NBA/soccer match data, standings, and top scorers. It is bundled as a single JavaScript file using Webpack and registered as a HACS (Home Assistant Community Store) integration.

## Commands

```bash
npm install       # Install dependencies
npm run build     # Bundle into dist/nba-live-card.bundle.js (production)
```

There are no test or lint scripts configured.

## Architecture

### Entry Point & Registration

[src/nba-live-card.js](src/nba-live-card.js) imports all card components. Each card self-registers via `customElements.define()` and appends its metadata to `window.customCards` for Home Assistant discovery.

### Card Structure

Each card lives under [src/cards/](src/cards/) and follows a consistent two-file pattern:

| File | Role |
|------|------|
| `nba-live-*.js` | Display card — reads HA entity state and renders UI |
| `nba-live-*-editor.js` | Config editor — renders the card configuration UI inside HA |

Cards and editors communicate via the `config-changed` custom DOM event.

### Available Cards

| Folder | Card | Purpose |
|--------|------|---------|
| `Classifica/` | Standings Card | League table with group/division filtering |
| `Tutte/` | Matches Card | Filterable match schedule and results |
| `Team/` | Team Card | Single-team match view with detail popups |
| `_Cannonieri/` | Top Scorers Card | Season top scorers list |

### Data Flow

```
Home Assistant entity (sensor.nbalive_*)
  └─▶ this.hass.states[entityId].attributes
        └─▶ Card renders via LitElement reactive properties
              └─▶ Filtering / sorting applied inline
                    └─▶ Popup detail views for matches
```

Entity attribute shapes:
- `standings` / `standings_groups` — ranked team rows (rank, points, W/D/L, goals)
- `matches` — match list (teams, scores, status, event breakdown)
- `scorers` — scorer rows with goals/assists
- `competition`, `season` — metadata objects

### Technology Stack

- **LitElement 4 / Lit 3** — web component base class with reactive properties and `html`/`css` tagged template literals
- **Webpack 5** — bundles everything into a single `dist/nba-live-card.bundle.js`
- **Babel 7** (`preset-env`, target `> 0.25%, not dead`) — transpiles to broad browser compatibility

### Home Assistant Integration Conventions

- Config is received via `setConfig(config)` and validated there.
- Card size is declared via `static getCardSize()`.
- Editor element is declared via `static getConfigElement()`.
- Default config is declared via `static getStubConfig(hass)`.
- Entity pickers in editors filter by prefix (e.g., `sensor.nbalive_classifica*`).
- CSS uses HA custom properties: `--primary-text-color`, `--divider-color`, `--card-background-color`, etc.

### Localization

UI labels and comments are in **Italian**. Keep new strings consistent with this.
