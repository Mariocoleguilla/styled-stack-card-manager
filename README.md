<h1 align="center">🎛 Styled Stack Card Manager</h1>

<p align="center">
  <em>A Home Assistant custom integration that adds a sidebar panel to create, preview, and manage reusable gradient presets for <a href="https://github.com/Mariocoleguilla/styled-stack-card">Styled Stack Card</a>.</em>
</p>

<p align="center">
  <a href="https://github.com/hacs/default"><img src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge&logo=homeassistant" alt="HACS Custom"></a>
  <a href="https://github.com/Mariocoleguilla/styled-stack-card-manager/releases"><img src="https://img.shields.io/github/v/release/Mariocoleguilla/styled-stack-card-manager?style=for-the-badge&color=orange" alt="Release"></a>
  <a href="https://github.com/Mariocoleguilla/styled-stack-card-manager/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Mariocoleguilla/styled-stack-card-manager?style=for-the-badge&color=blue" alt="License"></a>
  <img src="https://img.shields.io/badge/Type-Integration-purple?style=for-the-badge" alt="Type: Integration">
</p>

<p align="center">
  <strong>Companion card:</strong> <a href="https://github.com/Mariocoleguilla/styled-stack-card">Styled Stack Card</a> — the Lovelace card that consumes the presets created here.
</p>

---

## 📌 Overview

**Styled Stack Card Manager** is the companion integration for [Styled Stack Card](https://github.com/Mariocoleguilla/styled-stack-card).

It registers a dedicated **sidebar panel** in Home Assistant where you can visually design 2- or 3-color linear gradient presets. Presets are persisted to disk and **synchronised in real time** with every `styled-stack-card` instance on your dashboard — no page refresh or cache clearing needed.

---

## ✨ Features

| | Feature |
|---|---|
| 🎛 | **Sidebar panel** — accessible from the HA sidebar with the `mdi:gradient-horizontal` icon |
| 🎨 | **Visual preset editor** — interactive color pickers, opacity sliders, angle & position controls |
| 🌈 | **3-color stop support** — start, optional middle (with % position), and end |
| 💾 | **Persistent storage** — presets saved to `/config/www/styled-stack-card-presets/styled-stack-card-presets.js` via WebSocket API |
| ⚡ | **Real-time sync** — presets appear instantly in every `styled-stack-card` dropdown without reloading, for admins **and non-admin users** |
| 🗑 | **Create & delete** — manage your preset library from the panel |
| 🌐 | **100 % local** — no cloud, no external dependencies (`local_push`) |

---

## 📋 Requirements

- **Home Assistant** `2024.1.0` or newer.
- **[Styled Stack Card](https://github.com/Mariocoleguilla/styled-stack-card)** installed (HACS → Frontend).

---

## 🚀 Installation

### HACS (Recommended)

1. Open **HACS** → **Integrations**.
2. Click **⋮** (top right) → **Custom repositories**.
3. Add:
   | Field | Value |
   |---|---|
   | **Repository** | `https://github.com/Mariocoleguilla/styled-stack-card-manager` |
   | **Category** | `Integration` |
4. Find **Styled Stack Card Manager** in the list → **Download**.
5. **Restart** Home Assistant.
6. Go to **Settings → Devices & Services → Add Integration** → search **Styled Stack Card Manager**.

### Manual

1. Copy the `styled-stack-card-manager` folder into `config/custom_components/`:
   ```
   config/custom_components/styled-stack-card-manager/
   ```
2. **Restart** Home Assistant.
3. **Settings → Devices & Services → Add Integration** → **Styled Stack Card Manager**.

---

## 📖 How It Works

1. Click **Styled Stack Card** in the HA sidebar.
2. Design your gradient — choose name, colors, opacity, angle, and optional middle stop.
3. Click **Guardar Preset** — the integration writes the JS file and fires a real-time event.
4. Every `styled-stack-card` on your dashboard picks up the new preset **instantly** — it appears in the preset dropdown as `✨ <name>`.

### WebSocket API

| Command | Who can use it | Description |
|---|---|---|
| `styled_stack_card/save_presets` | Any authenticated user | Saves the full presets dict (`presets` is required) and notifies subscribers. |
| `styled_stack_card/subscribe_presets` | Any authenticated user | Subscription. Sends the current presets right away and then every change, as `{"presets": {...}}`. |

Home Assistant only lets non-admin users subscribe to an allowlist of built-in events with `subscribe_events`, so the card uses `styled_stack_card/subscribe_presets` instead (requires Styled Stack Card with the shared presets subscription). The internal `styled_stack_card_presets_updated` bus event is still fired for older card versions.

### Generated file format

```javascript
// /config/www/styled-stack-card-presets/styled-stack-card-presets.js
window.StyledStackCustomPresets = {
  "Chicle": {
    "color_start": "rgba(255, 64, 255, 0.60)",
    "color_mid": null,
    "color_mid_pos": 50,
    "color_end": "rgba(255, 251, 0, 0.60)",
    "angle": 135
  }
};
```

To use a preset in YAML:

```yaml
type: custom:styled-stack-card
style_config:
  preset: "Chicle"
cards:
  - type: tile
    entity: light.living_room
```

---

## 🔗 Related

| Repository | Type | Description |
|---|---|---|
| **[styled-stack-card](https://github.com/Mariocoleguilla/styled-stack-card)** | Dashboard (Frontend) | Lovelace card — gradient stacks |
| **[styled-stack-card-manager](https://github.com/Mariocoleguilla/styled-stack-card-manager)** | Integration | This integration — preset manager sidebar panel |

---

## ❓ FAQ

<details>
<summary><strong>Do I need to restart HA after creating a preset?</strong></summary>
No. Presets sync in real time via WebSocket events and are available immediately in every <code>styled-stack-card</code> editor and card instance.
</details>

<details>
<summary><strong>Can I install this without Styled Stack Card?</strong></summary>
The integration will work, but the presets it generates are designed to be consumed by <a href="https://github.com/Mariocoleguilla/styled-stack-card">Styled Stack Card</a>. Install both for the full experience.
</details>

<details>
<summary><strong>Where are presets stored?</strong></summary>
<code>/config/www/styled-stack-card-presets/styled-stack-card-presets.js</code> — a plain JavaScript file that sets <code>window.StyledStackCustomPresets</code>.
</details>

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>If this integration improves your dashboard workflow, give the repo a ⭐!</strong>
</p>

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=C6T54AXECTX9L">
    <img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Donate via PayPal"/>
  </a>
</p>
