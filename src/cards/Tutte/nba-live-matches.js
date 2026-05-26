import { LitElement, html, css } from "lit-element";

class CalcioLiveTodayMatchesCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      showPopup: { type: Boolean },
      activeMatch: { type: Object },
    };
  }

  setConfig(config) {
      if (!config.entity) {
        throw new Error("Devi definire un'entità");
      }

      this._config = config;
      this.maxEventsVisible = config.max_events_visible ? config.max_events_visible : 5;
      this.maxEventsTotal = config.max_events_total ? config.max_events_total : 50;
      this.showFinishedMatches = config.show_finished_matches !== undefined ? config.show_finished_matches : true;
      this.hideHeader = config.hide_header !== undefined ? config.hide_header : false;
      this.hidePastDays = config.hide_past_days !== undefined ? config.hide_past_days : 0;
      this.activeMatch = null;
      this.showPopup = false;
  }
  

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement("nba-live-matches-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.nba_live",
      max_events_visible: 5,
      max_events_total: 50,
      hide_past_days: 0,
      show_finished_matches: true,
      hide_header: false,
    };
  }
  
  _parseMatchDate(dateStr) {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
  
    const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];

    const matchDate = new Date(year, month - 1, day, hours, minutes);

    return matchDate;
  }
  
  getMatchStatusText(match) {
    if (match.status === 'Final' || match.state === 'post') {
      return `${match.home_score} - ${match.away_score} (Final)`;
    }
    if (match.state === 'in' && match.period > 0) {
      return `${match.home_score} - ${match.away_score} (Q${match.period} ${match.clock})`;
    }
    if (match.status === 'Scheduled' || match.state === 'pre') {
      return match.date;
    }
    return match.season_info || 'N/A';
  }

  showDetails(match) {
    this.activeMatch = match;
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  renderLinescores(match) {
    const homeScores = match.home_linescores || [];
    const awayScores = match.away_linescores || [];
    const periods = Math.max(homeScores.length, awayScores.length);
    if (periods === 0) return html``;

    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    for (let i = 4; i < periods; i++) labels.push(`OT${i - 3}`);

    const homeName = match.home_team.split(' ').pop();
    const awayName = match.away_team.split(' ').pop();

    return html`
      <div class="linescores-wrapper">
        <table class="linescores-table">
          <thead>
            <tr>
              <th class="ls-team-col"></th>
              ${labels.map(l => html`<th>${l}</th>`)}
              <th class="ls-total-col">T</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ls-team-col">${homeName}</td>
              ${homeScores.map(s => html`<td>${parseInt(s)}</td>`)}
              <td class="ls-total-col">${match.home_score}</td>
            </tr>
            <tr>
              <td class="ls-team-col">${awayName}</td>
              ${awayScores.map(s => html`<td>${parseInt(s)}</td>`)}
              <td class="ls-total-col">${match.away_score}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  renderPlayerStatsTable(teamData) {
    if (!teamData || !teamData.players) return html``;

    const activePlayers = teamData.players.filter(
      p => p.stats && Object.keys(p.stats).length > 0
    );
    activePlayers.sort((a, b) => parseInt(b.stats.pts || 0) - parseInt(a.stats.pts || 0));

    return html`
      <div class="player-stats-section">
        <div class="player-team-header">
          <span class="player-team-name">${teamData.team_name}</span>
          <span class="player-team-abbr">${teamData.team_abbreviation}</span>
        </div>
        <div class="player-table-scroll">
          <table class="player-table">
            <thead>
              <tr>
                <th class="pt-name-col">Joueur</th>
                <th>MIN</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
                <th>FG</th>
                <th>3PT</th>
                <th>+/-</th>
              </tr>
            </thead>
            <tbody>
              ${activePlayers.map(p => {
                const pm = parseInt(p.stats.plusMinus || 0);
                return html`
                  <tr>
                    <td class="pt-name-col">
                      <div class="player-name-cell">
                        <img class="player-headshot" src="${p.headshot}" alt="${p.name}" />
                        <span class="player-name">${p.name.split(' ').slice(-1)[0]}</span>
                        <span class="player-pos">${p.position}</span>
                      </div>
                    </td>
                    <td>${p.stats.minutes}</td>
                    <td class="pts-col">${p.stats.pts}</td>
                    <td>${p.stats.reb}</td>
                    <td>${p.stats.ast}</td>
                    <td>${p.stats.fg}</td>
                    <td>${p.stats['3pt']}</td>
                    <td class="${pm > 0 ? 'pm-plus' : pm < 0 ? 'pm-minus' : ''}">${p.stats.plusMinus}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderPlayerStats(playerStats) {
    if (!playerStats || !playerStats.has_detailed_stats) {
      return html`<p class="no-stats">Statistiques des joueurs non disponibles.</p>`;
    }
    return html`
      ${this.renderPlayerStatsTable(playerStats.home_players)}
      ${this.renderPlayerStatsTable(playerStats.away_players)}
    `;
  }

  renderPopup() {
    if (!this.showPopup || !this.activeMatch) {
      return html``;
    }

    const match = this.activeMatch;

    return html`
      <div class="popup-overlay" @click="${this.closePopup}">
        <div class="popup-content" @click="${(e) => e.stopPropagation()}">
          <h3 class="popup-title">Détails du Match</h3>

          <div class="popup-scoreboard">
            <div class="popup-team-info">
              <img class="popup-logo" src="${match.home_logo}" alt="${match.home_team}" />
              <span class="popup-team-abbr">${match.home_team.split(' ').pop()}</span>
            </div>
            <div class="popup-score-center">
              <span class="popup-score">${match.home_score} – ${match.away_score}</span>
              <span class="popup-status">${match.status}</span>
              <span class="popup-venue">${match.venue}</span>
            </div>
            <div class="popup-team-info">
              <img class="popup-logo" src="${match.away_logo}" alt="${match.away_team}" />
              <span class="popup-team-abbr">${match.away_team.split(' ').pop()}</span>
            </div>
          </div>

          ${this.renderLinescores(match)}

          <h4 class="popup-subtitle">Statistiques des Joueurs</h4>
          ${this.renderPlayerStats(match.player_stats)}

          <button @click="${this.closePopup}" class="close-button">Fermer</button>
        </div>
      </div>
    `;
  }

  render() {
      if (!this.hass || !this._config) {
        return html``;
      }

      const entityId = this._config.entity;
      const stateObj = this.hass.states[entityId];

      if (!stateObj) {
        return html`<ha-card>Entità sconosciuta: ${entityId}</ha-card>`;
      }

      let matches = stateObj.attributes.matches || [];
      const leagueInfo = stateObj.attributes.league_info ? stateObj.attributes.league_info[0] : null;
      const teamLogo = stateObj.attributes.team_logo || null;

      if (!this.showFinishedMatches) {
        matches = matches.filter((match) => match.status !== "Full Time");
      }
      
      matches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const currentDate = new Date();
      if (this.hidePastDays > 0) {
        const daysAgo = new Date(currentDate);
        daysAgo.setDate(daysAgo.getDate() - this.hidePastDays);

        console.log(`Current date: ${currentDate}, Filter date (days ago): ${daysAgo}`);

        matches = matches.filter((match) => {
          const matchDate = this._parseMatchDate(match.date);
          return matchDate >= daysAgo;
        });
      }

      const limitedMatches = matches.slice(0, this.maxEventsTotal);

      if (limitedMatches.length === 0) {
        return html`<ha-card>Nessuna partita disponibile</ha-card>`;
      }

      const scrollHeight = this.maxEventsVisible * 150;

      return html`
        <ha-card>
          ${!this.hideHeader ? html`
          <div class="header">
            ${leagueInfo && leagueInfo.logo_href ? html`
            <div class="league-header">
              <img class="league-logo" src="${leagueInfo.logo_href}" alt="Logo ${leagueInfo.abbreviation}" />
              <div class="league-info">
                <div class="league-name">${leagueInfo.abbreviation}</div>
                <div class="league-dates">${leagueInfo.startDate} - ${leagueInfo.endDate}</div>
              </div>
            </div>` : ''}

            ${teamLogo ? html`
            <div class="team-header">
              <img class="team-logo" src="${teamLogo}" alt="Logo del Team" />
            </div>` : ''}
          </div>
          ` : ''}
          <div class="scroll-content" style="max-height: ${scrollHeight}px; overflow-y: auto;">
            ${limitedMatches.map((match, index) => html`
              <div class="match-wrapper">
                <div class="match-header">
                  <div class="match-competition">
                    ${match.venue} | <span class="match-date">${match.date}</span>
                    ${match.status !== 'Scheduled' 
                      ? html`<span class="info-icon" @click="${() => this.showDetails(match)}">Info</span>`
                      : ''}
                  </div>
                </div>
                <div class="match">
                  <img class="team-logo" src="${match.home_logo}" alt="${match.home_team}" />
                  <div class="match-info">
                    <div class="team-name">${match.home_team}</div>
                    <div class="match-result">
                      ${this.getMatchStatusText(match)}
                    </div>
                    <div class="team-name">${match.away_team}</div>
                  </div>
                  <img class="team-logo" src="${match.away_logo}" alt="${match.away_team}" />
                </div>
                ${index < limitedMatches.length - 1 ? html`<hr class="separator-line" />` : ''}
              </div>
            `)}
          </div>
          ${this.renderPopup()}
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
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          position: relative;
        }
        .league-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .league-logo {
          width: 80px;
          height: 80px;
          margin-right: 15px;
        }
        .league-info {
          text-align: center;
          flex-grow: 1;
        }
        .league-name {
          font-size: 22px;
          font-weight: bold;
        }
        .league-dates {
          font-size: 14px;
          color: gray;
        }
        .team-header {
          text-align: center;
        }
        .team-logo {
          width: 75px;
          height: 75px;
          margin-left: 15px;
        }
        .separator-line {
          border: none;
          border-top: 1px solid var(--divider-color);
          margin-top: 10px;
        }
        .match-competition {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: blue;
        }
        .match-date {
          color: orange;
        }
        .match-wrapper {
          margin-bottom: 16px;
        }
        .team-name {
          font-size: 17px;
          font-weight: bold;
          text-align: center;
        }
        hr {
          border: 0;
          border-top: 1px solid var(--divider-color);
          margin: 16px 0;
        }
        .scroll-content {
          overflow-y: auto;
        }
        .match {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .match-info {
          text-align: center;
          flex: 1;
        }
        .match-result {
          font-size: 16px;
          font-weight: bold;
          margin: 8px 0;
          color: green;
        }
        .info-icon {
          font-size: 12px;
          color: var(--primary-color);
          cursor: pointer;
          margin-left: 8px;
        }
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .popup-content {
          background: var(--primary-background-color);
          padding: 16px;
          border-radius: 8px;
          width: 80%;
          max-width: 400px;
          overflow-y: auto;
          max-height: 80vh;
        }
        .popup-title {
          color: var(--primary-color);
          margin-top: 0;
        }
        .popup-logos {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }
        .popup-logo {
          width: 60px;
          height: 60px;
          margin: 0 10px;
        }
        .popup-subtitle {
          color: var(--primary-color);
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .close-button {
          background: var(--primary-color);
          color: white;
          padding: 8px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 16px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .close-button:hover {
          background: var(--primary-color-dark);
        }
        /* Scoreboard */
        .popup-scoreboard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .popup-team-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .popup-team-abbr {
          font-size: 12px;
          font-weight: bold;
          color: var(--secondary-text-color);
        }
        .popup-score-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .popup-score {
          font-size: 26px;
          font-weight: bold;
          color: var(--primary-text-color);
          letter-spacing: 2px;
        }
        .popup-status {
          font-size: 11px;
          color: green;
          font-weight: bold;
          margin-top: 2px;
        }
        .popup-venue {
          font-size: 10px;
          color: var(--secondary-text-color);
          text-align: center;
          margin-top: 2px;
        }
        /* Linescores */
        .linescores-wrapper {
          overflow-x: auto;
          margin-bottom: 16px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
        }
        .linescores-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .linescores-table th,
        .linescores-table td {
          text-align: center;
          padding: 5px 8px;
        }
        .linescores-table thead tr {
          background: var(--primary-color);
          color: white;
        }
        .linescores-table tbody tr:first-child {
          border-bottom: 1px solid var(--divider-color);
        }
        .ls-team-col {
          text-align: left !important;
          font-weight: bold;
          padding-left: 10px !important;
          white-space: nowrap;
        }
        .ls-total-col {
          font-weight: bold;
          color: var(--primary-color);
        }
        /* Player stats */
        .player-stats-section {
          margin-bottom: 14px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          overflow: hidden;
        }
        .player-team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--primary-color);
          color: white;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: bold;
        }
        .player-team-abbr {
          font-size: 11px;
          opacity: 0.85;
        }
        .player-table-scroll {
          overflow-x: auto;
        }
        .player-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 300px;
        }
        .player-table th {
          text-align: center;
          padding: 4px 6px;
          border-bottom: 1px solid var(--divider-color);
          color: var(--secondary-text-color);
          font-size: 10px;
          font-weight: bold;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          white-space: nowrap;
        }
        .player-table td {
          text-align: center;
          padding: 5px 4px;
          border-bottom: 1px solid var(--divider-color);
          font-size: 12px;
        }
        .player-table tbody tr:last-child td {
          border-bottom: none;
        }
        .pt-name-col {
          text-align: left !important;
          min-width: 90px;
        }
        .player-name-cell {
          display: flex;
          align-items: center;
          gap: 5px;
          padding-left: 6px;
        }
        .player-headshot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .player-name {
          font-weight: bold;
          white-space: nowrap;
        }
        .player-pos {
          font-size: 10px;
          color: var(--secondary-text-color);
          flex-shrink: 0;
        }
        .pts-col {
          font-weight: bold;
          color: var(--primary-color);
        }
        .pm-plus {
          color: green;
          font-weight: bold;
        }
        .pm-minus {
          color: red;
        }
        .no-stats {
          color: var(--secondary-text-color);
          font-style: italic;
          text-align: center;
          padding: 8px 0;
        }
      `;
  }
}

customElements.define("nba-live-matches", CalcioLiveTodayMatchesCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'nba-live-matches',
  name: 'NBA Live Matches Card',
  description: 'Mostra le partite della settimana o del tuo Team',
});
