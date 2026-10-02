# NBA Live Card - Home Assistant

Cartes Lovelace pour l'intégration [NBA Live](https://github.com/Tonio5978/nba-live) : classement par conférence, matchs de la semaine et calendrier de votre équipe, avec le détail des matchs terminés (score par quart-temps et statistiques des joueurs).

Les cartes sont séparées pour vous laisser choisir celles que vous utilisez.

## Prérequis

L'intégration [NBA Live](https://github.com/Tonio5978/nba-live) doit être installée et configurée. Elle crée les capteurs utilisés par les cartes :

| Capteur | Contenu |
|---|---|
| `sensor.nbalive_classifica_nba_east` | Classement de la Conférence Est |
| `sensor.nbalive_classifica_nba_west` | Classement de la Conférence Ouest |
| `sensor.nbalive_all_nba` | Matchs de la veille aux 4 prochains jours |
| `sensor.nbalive_nba_team_<équipe>` | Calendrier de la saison d'une équipe |
| `sensor.nbalive_next_<équipe>` | Match en cours, récent ou à venir d'une équipe |

## Installation via HACS

1. Dans HACS, ajoutez le dépôt personnalisé `https://github.com/Tonio5978/nba-live-card` avec la catégorie **Dashboard**.
2. Recherchez « NBA Live Card » dans HACS et installez-la.
3. Rechargez le navigateur.

## Les cartes

Chaque carte dispose d'un éditeur visuel. Le sélecteur de capteur ne propose que les entités compatibles.

### Classement — `nba-live-classifica`

Classement NBA avec des onglets pour basculer entre les conférences Est et Ouest.

| Option | Description | Défaut |
|---|---|---|
| `entity_east` | Capteur de la Conférence Est | — |
| `entity_west` | Capteur de la Conférence Ouest | — |
| `hide_header` | Masque l'en-tête (nom et saison) | `false` |
| `max_teams_visible` | Nombre d'équipes visibles avant défilement | `15` |

```yaml
type: custom:nba-live-classifica
entity_east: sensor.nbalive_classifica_nba_east
entity_west: sensor.nbalive_classifica_nba_west
```

### Matchs — `nba-live-matches`

Liste des matchs, utilisable avec le capteur de la semaine (`sensor.nbalive_all_nba`) ou le calendrier d'une équipe (`sensor.nbalive_nba_team_*`). Le bouton **Info** d'un match ouvre son détail.

| Option | Description | Défaut |
|---|---|---|
| `entity` | Capteur de matchs | — |
| `show_finished_matches` | Affiche les matchs terminés | `true` |
| `hide_header` | Masque l'en-tête | `false` |
| `max_events_visible` | Nombre de matchs visibles avant défilement | `5` |
| `max_events_total` | Nombre total de matchs affichés | `50` |
| `hide_past_days` | Masque les matchs de plus de N jours (`0` = désactivé, nécessite `show_finished_matches`) | `0` |

Par exemple, avec `max_events_visible: 5` et `max_events_total: 10`, 5 matchs sont visibles et 5 autres apparaissent en faisant défiler la carte.

```yaml
type: custom:nba-live-matches
entity: sensor.nbalive_all_nba
max_events_visible: 5
max_events_total: 50
```

### Équipe — `nba-live-team`

Un seul match de votre équipe : en cours, terminé depuis moins de 48 h ou à venir.

| Option | Description |
|---|---|
| `entity` | Capteur `sensor.nbalive_next_*` |

```yaml
type: custom:nba-live-team
entity: sensor.nbalive_next_boston_celtics
```

## Développement

```bash
npm install
npm run build   # génère dist/nba-live-card.bundle.js
```

## Crédits

Ce projet est dérivé de [calcio-live-card](https://github.com/Bobsilvio/calcio-live-card) de Bobsilvio ([TikTok](https://www.tiktok.com/@silviosmartalexa), [Instagram](https://www.instagram.com/silviosmartalexa), [YouTube](https://www.youtube.com/@silviosmartalexa)).
