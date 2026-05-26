import { LitElement, html, css } from "lit-element";

class CalcioLiveStandingsCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      maxTeamsVisible: { type: Number },
      hideHeader: { type: Boolean },
      selectedConference: { type: String },
    };
  }

  setConfig(config) {
    if (!config.entity_east && !config.entity_west) {
      throw new Error("Vous devez définir entity_east et/ou entity_west");
    }
    this._config = config;
    this.maxTeamsVisible = config.max_teams_visible || 15;
    this.hideHeader = config.hide_header || false;
    this.selectedConference = this.selectedConference || 'east';
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement("nba-live-classifica-editor");
  }

  static getStubConfig() {
    return {
      entity_east: "sensor.calciolive_classifica_nba_east",
      entity_west: "sensor.calciolive_classifica_nba_west",
      max_teams_visible: 15,
      hide_header: false,
    };
  }

  _selectConference(conf) {
    this.selectedConference = conf;
  }

  _streakClass(streak) {
    if (!streak) return '';
    return String(streak).startsWith('W') ? 'streak-win' : 'streak-loss';
  }

  _clinchClass(clincher) {
    if (!clincher) return '';
    if (clincher === 'e') return 'clinch-out';
    if (String(clincher).includes('p')) return 'clinch-playin';
    return 'clinch-in';
  }

  render() {
    if (!this.hass || !this._config) return html``;

    const eastEntityId = this._config.entity_east;
    const westEntityId = this._config.entity_west;
    const hasEast = !!eastEntityId && !!this.hass.states[eastEntityId];
    const hasWest = !!westEntityId && !!this.hass.states[westEntityId];

    const activeEntityId = this.selectedConference === 'east' ? eastEntityId : westEntityId;
    const stateObj = activeEntityId ? this.hass.states[activeEntityId] : null;

    const refState = (hasEast ? this.hass.states[eastEntityId] : hasWest ? this.hass.states[westEntityId] : null);
    const seasonName = refState?.attributes?.season || '';

    let standings = stateObj?.attributes?.standings ? [...stateObj.attributes.standings] : [];
    standings = standings
      .filter(t => t.rank != null)
      .sort((a, b) => parseInt(a.rank) - parseInt(b.rank));

    const maxVisible = Math.min(this.maxTeamsVisible, standings.length);

    return html`
      <ha-card>
        ${!this.hideHeader ? html`
          <div class="card-header">
            <div class="competition-name">NBA</div>
            <div class="season-dates">Saison ${seasonName}</div>
            <hr class="separator" />
          </div>
        ` : ''}

        <div class="conf-tabs">
          <button
            class="conf-tab ${this.selectedConference === 'east' ? 'active' : ''}"
            @click="${() => this._selectConference('east')}"
          >Conférence Est</button>
          <button
            class="conf-tab ${this.selectedConference === 'west' ? 'active' : ''}"
            @click="${() => this._selectConference('west')}"
          >Conférence Ouest</button>
        </div>

        <div class="card-content">
          ${standings.length === 0 ? html`
            <p class="no-data">Aucune donnée disponible</p>
          ` : html`
            <div class="table-container" style="--max-teams-visible: ${maxVisible};">
              <table>
                <thead>
                  <tr>
                    <th class="col-rank">#</th>
                    <th class="col-team">Équipe</th>
                    <th class="col-stat">V</th>
                    <th class="col-stat">D</th>
                    <th class="col-stat">%</th>
                    <th class="col-stat">Éc.</th>
                    <th class="col-record">Dom.</th>
                    <th class="col-record">Ext.</th>
                    <th class="col-stat">+/-</th>
                    <th class="col-stat">Série</th>
                  </tr>
                </thead>
                <tbody>
                  ${standings.map((team) => html`
                    <tr class="${this._clinchClass(team.clincher)}">
                      <td class="col-rank">
                        <span class="rank-num">${team.rank}</span>
                      </td>
                      <td class="col-team">
                        <div class="team-cell">
                          <img class="team-crest" src="${team.team_logo}" alt="${team.team_name}" />
                          <span class="team-abbr">${team.team_abbreviation}</span>
                        </div>
                      </td>
                      <td class="col-stat won">${team.wins}</td>
                      <td class="col-stat lost">${team.losses}</td>
                      <td class="col-stat">${team.win_pct}</td>
                      <td class="col-stat gb">${team.games_behind}</td>
                      <td class="col-record">${team.home}</td>
                      <td class="col-record">${team.road}</td>
                      <td class="col-stat diff">${team.differential}</td>
                      <td class="col-stat">
                        <span class="streak ${this._streakClass(team.streak)}">${team.streak}</span>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
        box-sizing: border-box;
        width: 100%;
      }
      .card-header {
        margin-bottom: 8px;
      }
      .competition-name {
        font-weight: bold;
        font-size: 1.3em;
      }
      .season-dates {
        color: var(--secondary-text-color);
        font-size: 14px;
        margin-bottom: 4px;
      }
      .separator {
        width: 100%;
        height: 1px;
        background-color: var(--divider-color);
        border: none;
        margin: 4px 0 10px;
      }
      /* Onglets conférence */
      .conf-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .conf-tab {
        flex: 1;
        padding: 8px 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--secondary-background-color, rgba(0,0,0,0.04));
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }
      .conf-tab.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
      /* Tableau */
      .table-container {
        width: 100%;
        overflow-x: auto;
        overflow-y: auto;
        max-height: calc(var(--max-teams-visible, 15) * 38px + 36px);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 420px;
      }
      th, td {
        padding: 6px 4px;
        text-align: center;
        border-bottom: 1px solid var(--divider-color);
        white-space: nowrap;
        font-size: 12px;
      }
      th {
        background-color: var(--primary-background-color);
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      td { vertical-align: middle; }
      /* Colonnes */
      .col-rank { width: 24px; }
      .col-team { width: 70px; text-align: left; }
      .col-stat { width: 36px; }
      .col-record { width: 42px; font-size: 11px; color: var(--secondary-text-color); }
      /* Cellule équipe */
      .team-cell {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .team-crest {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      .team-abbr {
        font-weight: bold;
        font-size: 12px;
      }
      /* Rang */
      .rank-num {
        font-weight: bold;
        color: var(--secondary-text-color);
        font-size: 12px;
      }
      /* Couleurs stats */
      .won { color: #4CAF50; font-weight: bold; }
      .lost { color: #F44336; }
      .diff { font-weight: bold; color: var(--primary-color); }
      .gb { color: var(--secondary-text-color); }
      /* Série */
      .streak {
        font-weight: bold;
        font-size: 11px;
        padding: 1px 4px;
        border-radius: 3px;
      }
      .streak-win { color: #4CAF50; }
      .streak-loss { color: #F44336; }
      /* Lignes qualification */
      tr.clinch-in td { background: rgba(76,175,80,0.06); }
      tr.clinch-playin td { background: rgba(255,152,0,0.06); }
      tr.clinch-out td { opacity: 0.6; }
      /* Message vide */
      .no-data {
        text-align: center;
        color: var(--secondary-text-color);
        font-style: italic;
        padding: 16px 0;
      }
    `;
  }
}

customElements.define("nba-live-classifica", CalcioLiveStandingsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'nba-live-classifica',
  name: 'NBA Live Classifica Card',
  description: 'Affiche le classement NBA par conférence (Est / Ouest)',
});
