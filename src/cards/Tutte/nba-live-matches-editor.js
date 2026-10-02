import { LitElement, html, css } from 'lit';

class CalcioLiveTodayMatchesEditor extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      hass: { type: Object },
      entities: { type: Array },
    };
  }

  constructor() {
    super();
    this._entity = '';
    this.entities = [];
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 20px; /* Espace entre les options */
      }
      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      ha-select {
        width: 100%; /* Pleine largeur pour le sélecteur de capteur */
      }
      ha-textfield {
        width: 100%; /* Pleine largeur pour les champs numériques */
      }
    `;
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Configuration invalide');
    }
    this._config = { ...config };
    this._entity = this._config.entity || '';
  }

  get config() {
    return this._config;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      this._fetchEntities();
    }
    if (changedProperties.has('_config') && this._config && this._config.entity) {
      this._entity = this._config.entity;
    }
  }

  configChanged(newConfig) {
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _EntityChanged(ev) {
    if (!this._config) return;

    const newConfig = { ...this._config, entity: ev.target.value };
    this._entity = ev.target.value;

    this.configChanged(newConfig);
  }

  _fetchEntities() {
    if (!this.hass) return;
    this.entities = Object.keys(this.hass.states)
      .filter((entityId) => {
        if (!entityId.startsWith('sensor.nbalive_')) return false;
        const attrs = this.hass.states[entityId].attributes;
        return attrs && attrs.matches;
      })
      .sort();
  }
  
  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const value = target.type === 'number' ? parseInt(target.value, 10) : (target.checked !== undefined ? target.checked : target.value);

    if (target.configValue) {
      const newConfig = { ...this._config, [target.configValue]: value };
      this.configChanged(newConfig);
    }
  }

  render() {
      if (!this._config || !this.hass) {
        return html``;
      }

      return html`
        <div class="card-config">
          <h3>Capteur NBALive :</h3>
          <ha-select
              naturalMenuWidth
              fixedMenuPosition
              label="Entité"
              .configValue=${'entity'}
              .value=${this._entity}
              @change=${(e) => this._EntityChanged(e, 'entity')}
              @closed=${(ev) => ev.stopPropagation()}
              >
              ${this.entities.map((entity) => {
                  return html`<ha-list-item .value=${entity}>${entity}</ha-list-item>`;
              })}
          </ha-select>
        
          <h3>Paramètres :</h3>
          <div class="option">
            <ha-switch
              .checked=${this._config.show_finished_matches !== false}
              @change=${this._valueChanged}
              .configValue=${'show_finished_matches'}
            >
            </ha-switch>
            <label>Afficher les matchs terminés</label>
          </div>

          <div class="option">
            <ha-switch
              .checked=${this._config.hide_header === true}
              @change=${this._valueChanged}
              .configValue=${'hide_header'}
            >
            </ha-switch>
            <label>Masquer l'en-tête</label>
          </div>

          <div class="option">
            <ha-textfield
              label="Matchs visibles max"
              type="number"
              .value=${this._config.max_events_visible || 5}
              @change=${this._valueChanged}
              .configValue=${'max_events_visible'}
            ></ha-textfield>
          </div>

          <div class="option">
            <ha-textfield
              label="Matchs au total max"
              type="number"
              .value=${this._config.max_events_total || 50}
              @change=${this._valueChanged}
              .configValue=${'max_events_total'}
            ></ha-textfield>
          </div>
          
          <h4>Pour fonctionner, l'option « Afficher les matchs terminés » doit être activée.</h4>
          <div class="option">
            <ha-textfield
              label="Masquer les matchs de plus de (jours)"
              type="number"
              .value=${this._config.hide_past_days || 0}
              @change=${this._valueChanged}
              .configValue=${'hide_past_days'}
            ></ha-textfield>
          </div>
        </div>
      `;
    }
}

customElements.define('nba-live-matches-editor', CalcioLiveTodayMatchesEditor);
