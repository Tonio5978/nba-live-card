# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NBA Live Card** is a Home Assistant custom card (Lovelace plugin) that displays NBA standings, matches and team schedules from the [nba-live](https://github.com/Tonio5978/nba-live) integration (ESPN data). It is bundled as a single JavaScript file using Webpack and distributed through HACS (category `plugin`).

The project is a fork of `calcio-live-card` (soccer). Some soccer leftovers remain in the code (e.g. Team card popup, `Full Time` status checks) — don't assume they reflect the NBA data shape.

## Commands

```bash
npm install       # Install dependencies
npm run build     # Bundle into dist/nba-live-card.bundle.js (production)
```

There are no test or lint scripts configured. `dist/nba-live-card.bundle.js` is committed (HACS serves it, see `hacs.json`), so rebuild and commit it after any change in `src/`.

## Architecture

### Entry Point & Registration

[src/nba-live-card.js](src/nba-live-card.js) imports all card components. Each card self-registers via `customElements.define()` and appends its metadata to `window.customCards` for Home Assistant discovery.

### Card Structure

Each card lives under [src/cards/](src/cards/) and follows a consistent two-file pattern:

| File | Role |
|------|------|
| `nba-live-*.js` | Display card — reads HA entity state and renders UI |
| `nba-live-*-editor.js` | Config editor — renders the card configuration UI inside HA |

Cards and editors communicate via the `config-changed` custom DOM event. All files import from `lit`.

### Available Cards

| Folder | Element | Purpose | Sensors |
|--------|---------|---------|---------|
| `Classifica/` | `nba-live-classifica` | Standings with East / West tabs | `sensor.nbalive_classifica_nba_east`, `..._west` |
| `Tutte/` | `nba-live-matches` | Match list; popup with linescores and player box score | `sensor.nbalive_all_nba`, `sensor.nbalive_nba_team_<slug>` |
| `Team/` | `nba-live-team` | Single match of one team | `sensor.nbalive_next_<slug>` |

`_Cannonieri/` is a legacy soccer card (top scorers): it is not imported in the entry point and the integration provides no matching sensor.

Element names (`nba-live-*`) are part of users' dashboard configs: never rename them.

### Data Flow

```
Home Assistant entity (sensor.nbalive_*)
  └─▶ this.hass.states[entityId].attributes
        └─▶ Card renders via LitElement reactive properties
              └─▶ Filtering / sorting applied inline
                    └─▶ Popup detail views for matches
```

Entity attribute shapes (produced by the integration):
- Standings sensors: `season` (string, e.g. `2025-26`), `conference`, `standings` — rows with `rank`, `team_name`, `team_abbreviation`, `team_logo`, `wins`, `losses`, `win_pct`, `games_behind`, `home`, `road`, `differential`, `streak`, `clincher`.
- Match sensors: `matches` — each with `date` (string `JJ/MM/AAAA HH:MM`, HA time zone), `home_team`/`away_team`, `*_logo`, `*_score`, `*_linescores`, `state` (`pre` / `in` / `post`), `status` (ESPN description, e.g. `Scheduled`, `Final`), `period`, `clock`, `venue`, `player_stats` (only for finished matches, `has_detailed_stats`, `home_players` / `away_players`).
- `sensor.nbalive_all_nba` also has `league_info`; team sensors have `team_name` and `team_logo`.

### Technology Stack

- **Lit 3** — web component base class with reactive properties and `html`/`css` tagged template literals
- **Webpack 5** — bundles everything into a single `dist/nba-live-card.bundle.js`
- **Babel 7** (`preset-env`, target `> 0.25%, not dead`) — transpiles to broad browser compatibility

### Home Assistant Integration Conventions

- Config is received via `setConfig(config)` and validated there.
- Card size is declared via the instance method `getCardSize()`.
- Editor element is declared via `static getConfigElement()`.
- Default config is declared via `static getStubConfig(hass)`.
- Entity pickers in editors filter by prefix `sensor.nbalive_` plus the presence of specific attributes (`standings`, `matches`, `league_info`).
- CSS uses HA custom properties: `--primary-text-color`, `--divider-color`, `--card-background-color`, etc.

### Localization

UI labels, error messages, comments and the README are in **French**. Keep new strings consistent with this. Data coming from ESPN (team names, `status`) is displayed as-is.

### Constraints from the owner

Do not change the look (CSS, layout) or the functional behavior of the cards unless explicitly asked.
