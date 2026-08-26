import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class StyledStackCardPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      presets: { type: Object },
      _presetName: { type: String },
      _currentData: { type: Object }
    };
  }

  constructor() {
    super();
    this.presets = {};
    this._presetName = "";
    this._resetCurrentData();
  }

  connectedCallback() {
    super.connectedCallback();
    const script = document.createElement('script');
    script.src = `/local/styled-stack-card-presets/styled-stack-card-presets.js?t=${Date.now()}`;
    script.onload = () => {
      if (window.StyledStackCustomPresets) {
        this.presets = { ...window.StyledStackCustomPresets };
      }
    };
    document.head.appendChild(script);
  }

  _resetCurrentData() {
    this._currentData = {
      color_start: "rgba(128,128,128,0.25)",
      color_mid: null,
      color_mid_pos: 50,
      color_end: "rgba(30,30,30,0)",
      angle: 135
    };
  }

  // --- Helpers de conversión rgba <-> [R,G,B] + alpha ---
  _parseRgbaString(value) {
    if (!value) return { rgb: [128, 128, 128], alpha: 100 };
    const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      return { rgb: [r, g, b], alpha: Math.round(a * 100) };
    }
    return { rgb: [128, 128, 128], alpha: 100 };
  }

  _rgbToRgbaString(rgb, alpha) {
    const a = (alpha / 100).toFixed(2);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  }

  _getStyleData() {
    const style = this._currentData;
    const startParsed = this._parseRgbaString(style.color_start);
    const endParsed = this._parseRgbaString(style.color_end);
    const hasMid = style.color_mid !== undefined && style.color_mid !== null;
    const midParsed = hasMid
      ? this._parseRgbaString(style.color_mid)
      : { rgb: [128, 128, 128], alpha: 50 };

    return {
      color_start_rgb: startParsed.rgb,
      color_start_alpha: startParsed.alpha,
      color_end_rgb: endParsed.rgb,
      color_end_alpha: endParsed.alpha,
      has_mid: hasMid,
      color_mid_rgb: midParsed.rgb,
      color_mid_alpha: midParsed.alpha,
      color_mid_pos: style.color_mid_pos ?? 50,
      angle: Number(style.angle ?? 135),
    };
  }

  _updateData(newData) {
    this._currentData = { ...this._currentData, ...newData };
  }

  // --- Manejadores de eventos ---
  _handlePresetSelect(ev) {
    const selected = ev.target.value;
    if (!selected) {
      this._presetName = "";
      this._resetCurrentData();
    } else {
      this._presetName = selected;
      this._currentData = { ...this.presets[selected] };
    }
  }

  _handleNameChange(ev) {
    this._presetName = ev.target.value;
  }

  _handleAngleChanged(ev) {
    ev.stopPropagation();
    this._updateData({ angle: ev.detail.value.angle });
  }

  _handleColorChange(field, rgb, alpha) {
    this._updateData({ [field]: this._rgbToRgbaString(rgb, alpha) });
  }

  _handleColorRgbChanged(ev, field) {
    ev.stopPropagation();
    const data = this._getStyleData();
    const newRgb = ev.detail.value;
    const alpha =
      field === 'color_start' ? data.color_start_alpha
        : field === 'color_mid' ? data.color_mid_alpha
          : data.color_end_alpha;
    this._handleColorChange(field, newRgb, alpha);
  }

  _handleAlphaChanged(ev, field) {
    const alpha = parseInt(ev.target.value, 10);
    const data = this._getStyleData();
    const rgb =
      field === 'color_start' ? data.color_start_rgb
        : field === 'color_mid' ? data.color_mid_rgb
          : data.color_end_rgb;
    this._handleColorChange(field, rgb, alpha);
  }

  _handleMidPosChanged(ev) {
    const pos = parseInt(ev.target.value, 10);
    this._updateData({ color_mid_pos: pos });
  }

  _toggleMidColor() {
    const hasMid = this._currentData.color_mid !== undefined && this._currentData.color_mid !== null;
    if (hasMid) {
      this._updateData({ color_mid: null, color_mid_pos: null });
    } else {
      this._updateData({ color_mid: 'rgba(128, 128, 128, 0.15)', color_mid_pos: 50 });
    }
  }

  _angleSchema() {
    return [{ name: 'angle', selector: { number: { min: 0, max: 360, step: 1, unit_of_measurement: '°' } } }];
  }

  _computeAngleLabel(schema) {
    return schema.name === 'angle' ? 'Ángulo del degradado' : schema.name;
  }

  // --- Funciones del backend ---
  async guardarPresets() {
    if (!this._presetName.trim()) {
      alert("Por favor, introduce un nombre para el preset.");
      return;
    }

    const presetsActuales = { ...this.presets };
    presetsActuales[this._presetName.trim()] = this._currentData;

    try {
      await this.hass.callWS({
        type: "styled_stack_card/save_presets",
        presets: presetsActuales
      });

      this.presets = { ...presetsActuales };
      alert(`¡Preset '${this._presetName}' guardado correctamente!`);

    } catch (err) {
      console.error("Error al guardar", err);
      alert("Hubo un error al guardar el preset.");
    }
  }

  // ¡NUEVA FUNCIÓN! Para eliminar presets
  async eliminarPreset() {
    if (!this.presets[this._presetName]) return;

    if (!confirm(`¿Estás seguro de que deseas eliminar el preset '${this._presetName}'?`)) {
      return;
    }

    const presetsActuales = { ...this.presets };
    delete presetsActuales[this._presetName]; // Borramos la clave del objeto

    try {
      await this.hass.callWS({
        type: "styled_stack_card/save_presets",
        presets: presetsActuales // Enviamos la lista sin el preset
      });

      this.presets = { ...presetsActuales };
      this._presetName = "";
      this._resetCurrentData();
      alert(`Preset eliminado correctamente.`);

    } catch (err) {
      console.error("Error al eliminar", err);
      alert("Hubo un error al eliminar el preset.");
    }
  }

  // --- Renderizado ---
  _renderColorRow(label, field, rgb, alpha, opts) {
    const solidColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const previewColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha / 100).toFixed(2)})`;
    const alphaTrack = `linear-gradient(to right, transparent, ${solidColor})`;

    return html`
      <div class="color-row">
        <div class="color-row-header">
          <span class="color-row-label">${label}</span>
          <div class="color-row-header-right">
            ${opts?.removable ? html`
              <button class="btn-remove-mid" @click=${this._toggleMidColor} title="Eliminar color medio">✕</button>
            ` : ""}
            <div class="color-swatch-wrap">
              <div class="checker-bg"></div>
              <div class="color-swatch" style="background:${previewColor}"></div>
            </div>
          </div>
        </div>
        <div class="color-row-body">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ color_rgb: {} }}
            .value=${rgb}
            @value-changed=${(e) => this._handleColorRgbChanged(e, field)}
          ></ha-selector>
          <div class="alpha-row">
            <span class="alpha-label">Opacidad</span>
            <div class="alpha-slider-wrap">
              <div class="alpha-track" style="--alpha-gradient:${alphaTrack}"></div>
              <input type="range" class="alpha-slider" min="0" max="100" step="1" .value=${String(alpha)} @input=${(e) => this._handleAlphaChanged(e, field)} />
            </div>
            <span class="alpha-value">${alpha}%</span>
          </div>
          ${opts?.midPos !== undefined ? html`
            <div class="alpha-row">
              <span class="alpha-label">Posición</span>
              <div class="alpha-slider-wrap">
                <div class="alpha-track" style="--alpha-gradient:linear-gradient(to right, var(--divider-color), var(--primary-color))"></div>
                <input type="range" class="alpha-slider" min="1" max="99" step="1" .value=${String(opts.midPos)} @input=${this._handleMidPosChanged} />
              </div>
              <span class="alpha-value">${opts.midPos}%</span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass) return "";

    const data = this._getStyleData();
    const gradientPreview = data.has_mid
      ? `linear-gradient(${data.angle}deg, ${this._rgbToRgbaString(data.color_start_rgb, data.color_start_alpha)} 0%, ${this._rgbToRgbaString(data.color_mid_rgb, data.color_mid_alpha)} ${data.color_mid_pos}%, ${this._rgbToRgbaString(data.color_end_rgb, data.color_end_alpha)} 100%)`
      : `linear-gradient(${data.angle}deg, ${this._rgbToRgbaString(data.color_start_rgb, data.color_start_alpha)} 0%, ${this._rgbToRgbaString(data.color_end_rgb, data.color_end_alpha)} 100%)`;

    // Comprobamos si el nombre actual existe en los presets guardados
    const isExistingPreset = Object.keys(this.presets).includes(this._presetName);

    return html`
      <div class="manager-container">
        <div class="header">
          <h2>🎨 Styled Stack Card Manager</h2>
          <p>Crea nuevos presets de colores o edita los que ya tienes.</p>
        </div>

        <div class="form-row-group">
          <!-- Selector de presets existentes -->
          <div class="form-group">
            <label>1. Cargar un preset (Opcional)</label>
            <select class="custom-input" .value=${this._presetName} @change=${this._handlePresetSelect}>
              <option value="">-- Crear Nuevo Preset --</option>
              ${Object.keys(this.presets).map(
      key => html`<option value="${key}">${key}</option>`
    )}
            </select>
          </div>

          <!-- Nombre del preset -->
          <div class="form-group">
            <label>2. Nombre del Preset</label>
            <input type="text" class="custom-input" placeholder="ej: mi_salon" .value=${this._presetName} @input=${this._handleNameChange} />
          </div>
        </div>

        <div class="gradient-section">
          <div class="gradient-preview-wrap">
            <div class="gradient-preview" style="background:${gradientPreview}"></div>
            <div class="gradient-preview-label">Vista previa del degradado</div>
          </div>

          ${this._renderColorRow('Color superior', 'color_start', data.color_start_rgb, data.color_start_alpha)}

          ${data.has_mid
        ? this._renderColorRow('Color medio', 'color_mid', data.color_mid_rgb, data.color_mid_alpha, { removable: true, midPos: data.color_mid_pos })
        : html`
              <button class="btn-add-mid" @click=${this._toggleMidColor}>
                <span class="btn-add-mid-icon">+</span>
                Añadir color intermedio
              </button>
            `
      }

          ${this._renderColorRow('Color inferior', 'color_end', data.color_end_rgb, data.color_end_alpha)}

          <div class="angle-container">
             <ha-form
               .hass=${this.hass}
               .data=${{ angle: data.angle }}
               .schema=${this._angleSchema()}
               .computeLabel=${this._computeAngleLabel}
               @value-changed=${this._handleAngleChanged}
             ></ha-form>
          </div>
        </div>

        <!-- BOTONES DE ACCIÓN -->
        <div class="action-buttons">
          <button class="btn-save" @click=${this.guardarPresets}>Guardar Preset</button>
          
          ${isExistingPreset ? html`
            <button class="btn-delete" @click=${this.eliminarPreset}>Eliminar Preset</button>
          ` : ""}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .manager-container { max-width: 600px; margin: 0 auto; padding: 24px; color: var(--primary-text-color); }
      .header { margin-bottom: 24px; }
      .header h2 { margin: 0 0 8px 0; }
      .header p { margin: 0; color: var(--secondary-text-color); }
      
      .form-row-group { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
      @media (max-width: 500px) { .form-row-group { grid-template-columns: 1fr; } }
      .form-group { display: flex; flex-direction: column; gap: 8px; }
      .form-group label { font-weight: bold; font-size: 0.9em; }
      .custom-input { padding: 12px; font-size: 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--card-background-color); color: var(--primary-text-color); width: 100%; box-sizing: border-box; }
      
      /* --- Estilos para los botones de acción --- */
      .action-buttons {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      .btn-save {
        flex: 1;
        padding: 14px;
        font-size: 16px;
        font-weight: bold;
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .btn-save:hover { opacity: 0.9; }

      .btn-delete {
        flex: 1;
        padding: 14px;
        font-size: 16px;
        font-weight: bold;
        background: var(--error-color, #f44336);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .btn-delete:hover { opacity: 0.9; }

      .angle-container { background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 10px; padding: 12px; }
      ha-form { display: block; }
      ha-selector { display: block; }

      /* --- CSS ORIGINAL --- */
      .gradient-section { display: flex; flex-direction: column; gap: 10px; }
      .gradient-preview-wrap { border-radius: 10px; overflow: hidden; border: 1px solid var(--divider-color); }
      .gradient-preview { height: 56px; width: 100%; transition: background 0.35s ease; }
      .gradient-preview-label { font-size: 0.72em; color: var(--secondary-text-color); text-align: center; padding: 4px 0; background: var(--secondary-background-color); letter-spacing: 0.03em; }
      .color-row { background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 10px; overflow: hidden; }
      .color-row-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 8px; border-bottom: 1px solid var(--divider-color); }
      .color-row-label { font-size: 0.85em; font-weight: 600; color: var(--primary-text-color); letter-spacing: 0.02em; }
      .color-row-header-right { display: flex; align-items: center; gap: 8px; }
      .btn-remove-mid { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--error-color, #f44336); background: transparent; color: var(--error-color, #f44336); font-size: 0.8em; cursor: pointer; padding: 0; line-height: 1; transition: background 0.15s ease, color 0.15s ease; }
      .btn-remove-mid:hover { background: var(--error-color, #f44336); color: #fff; }
      .btn-add-mid { display: flex; align-items: center; gap: 8px; width: 100%; background: transparent; border: 1.5px dashed var(--divider-color); border-radius: 10px; padding: 10px 14px; color: var(--secondary-text-color); font-size: 0.85em; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease; }
      .btn-add-mid:hover { border-color: var(--primary-color); color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 6%, transparent); }
      .btn-add-mid-icon { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid currentColor; font-size: 1.1em; line-height: 1; flex-shrink: 0; }
      .color-swatch-wrap { position: relative; width: 28px; height: 28px; border-radius: 50%; overflow: hidden; border: 2px solid var(--divider-color); flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
      .checker-bg { position: absolute; inset: 0; background-image: linear-gradient(45deg, #aaa 25%, transparent 25%), linear-gradient(-45deg, #aaa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #aaa 75%), linear-gradient(-45deg, transparent 75%, #aaa 75%); background-color: #fff; background-size: 7px 7px; background-position: 0 0, 0 3.5px, 3.5px -3.5px, -3.5px 0; }
      .color-swatch { position: absolute; inset: 0; transition: background 0.2s ease; }
      .color-row-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
      .alpha-row { display: flex; align-items: center; gap: 10px; }
      .alpha-label { font-size: 0.78em; color: var(--secondary-text-color); white-space: nowrap; min-width: 54px; }
      .alpha-slider-wrap { position: relative; flex: 1; height: 20px; display: flex; align-items: center; }
      .alpha-track { position: absolute; left: 0; right: 0; height: 8px; border-radius: 4px; pointer-events: none; background-image: linear-gradient(45deg, #bbb 25%, transparent 25%), linear-gradient(-45deg, #bbb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #bbb 75%), linear-gradient(-45deg, transparent 75%, #bbb 75%), var(--alpha-gradient, linear-gradient(to right, transparent, grey)); background-color: #fff; background-size: 8px 8px, 8px 8px, 8px 8px, 8px 8px, 100% 100%; background-position: 0 0, 0 4px, 4px -4px, -4px 0, 0 0; }
      .alpha-slider { position: relative; width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; z-index: 1; }
      .alpha-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--card-background-color, #fff); border: 2.5px solid var(--primary-color); box-shadow: 0 1px 5px rgba(0,0,0,0.28); cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .alpha-slider::-webkit-slider-thumb:hover { transform: scale(1.18); box-shadow: 0 2px 9px rgba(0,0,0,0.32); }
      .alpha-value { font-size: 0.8em; font-weight: 600; color: var(--primary-text-color); min-width: 34px; text-align: right; }
    `;
  }
}

customElements.define("styled-stack-card-panel", StyledStackCardPanel);