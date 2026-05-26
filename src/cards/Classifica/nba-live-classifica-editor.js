import { LitElement, html, css } from 'lit';

class CalcioLiveClassificaCardEditor extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      hass: { type: Object },
      entities: { type: Array },
    };
  }

  constructor() {
    super();
    this.entities = [];
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      ha-select { width: 100%; }
      ha-textfield { width: 100%; }
      .hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 0;
        font-style: italic;
      }
      h3 { margin: 4px 0; }
    `;
  }

  setConfig(config) {
    if (!config) throw new Error('Configuration invalide');
    this._config = { ...config };
  }

  get config() {
    return this._config;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      this._fetchEntities();
    }
  }

  configChanged(newConfig) {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }

  _fetchEntities() {
    if (!this.hass) return;
    this.entities = Object.keys(this.hass.states)
      .filter((entityId) => {
        if (!entityId.startsWith('sensor.')) return false;
        const attrs = this.hass.states[entityId].attributes;
        return attrs && (attrs.standings_groups || attrs.standings);
      })
      .sort();
  }

  _entityChanged(ev, key) {
    if (!this._config) return;
    this.configChanged({ ...this._config, [key]: ev.target.value });
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const value = target.type === 'number'
      ? parseInt(target.value, 10)
      : target.checked !== undefined ? target.checked : target.value;
    if (target.configValue) {
      this.configChanged({ ...this._config, [target.configValue]: value });
    }
  }

  _renderEntitySelect(label, key) {
    const current = this._config?.[key] || '';
    return html`
      <ha-select
        naturalMenuWidth
        fixedMenuPosition
        label="${label}"
        .value=${current}
        @change=${(e) => this._entityChanged(e, key)}
        @closed=${(ev) => ev.stopPropagation()}
      >
        ${this.entities.map((entity) => html`
          <ha-list-item .value=${entity}>${entity}</ha-list-item>
        `)}
      </ha-select>
    `;
  }

  render() {
    if (!this._config || !this.hass) return html``;

    return html`
      <div class="card-config">
        <h3>Capteur NBALive :</h3>
        <p class="hint">Sélectionnez une entité par conférence. Les onglets Est / Ouest de la carte basculent entre les deux.</p>

        ${this._renderEntitySelect('Entité — Conférence Est', 'entity_east')}
        ${this._renderEntitySelect('Entité — Conférence Ouest', 'entity_west')}

        <h3>Paramètres :</h3>

        <div class="option">
          <ha-switch
            .checked=${this._config.hide_header === true}
            @change=${this._valueChanged}
            .configValue=${'hide_header'}
          ></ha-switch>
          <label>Masquer l'en-tête</label>
        </div>

        <div class="option">
          <ha-textfield
            label="Équipes visibles max"
            type="number"
            .value=${this._config.max_teams_visible || 15}
            @change=${this._valueChanged}
            .configValue=${'max_teams_visible'}
          ></ha-textfield>
        </div>
      </div>
    `;
  }
}

customElements.define('nba-live-classifica-editor', CalcioLiveClassificaCardEditor);
