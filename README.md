<p align="center">
  <h1 align="center">🎨 Styled Stack Card Manager</h1>
  <p align="center">
    A Home Assistant custom integration that provides a dedicated sidebar panel to create, edit, preview, and manage custom gradient presets for <b>Styled Stack Card</b>.
  </p>
</p>

<p align="center">
  <a href="https://github.com/hacs/default">
    <img src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge&logo=homeassistant" alt="HACS Badge">
  </a>
  <a href="https://github.com/Mariocoleguilla/styled-stack-card-manager/releases">
    <img src="https://img.shields.io/github/v/release/Mariocoleguilla/styled-stack-card-manager?style=for-the-badge&color=orange" alt="Release">
  </a>
  <a href="https://github.com/Mariocoleguilla/styled-stack-card-manager/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Mariocoleguilla/styled-stack-card-manager?style=for-the-badge&color=blue" alt="License">
  </a>
</p>

---

## 📌 Overview

**Styled Stack Card Manager** is a Home Assistant custom integration designed to complement [Styled Stack Card](https://github.com/Mariocoleguilla/styled-stack-card).

It adds a dedicated UI panel to your Home Assistant sidebar, allowing you to visually design custom 2-color or 3-color linear gradient presets. Presets are saved via Home Assistant WebSockets directly into `/config/www/styled-stack-card-presets/styled-stack-card-presets.js`, where they are automatically available across your entire dashboard!

---

## ✨ Features

- 🎛 **Sidebar Panel**: Access a dedicated manager UI right from your Home Assistant sidebar (`mdi:gradient-horizontal`).
- 🎨 **Visual Preset Editor**: Design custom gradients with interactive color pickers, opacity sliders, position controls, and angle adjustments.
- 🌈 **3-Color Stop Support**: Configure Start, optional Middle (with % position), and End colors.
- ⚡ **WebSocket File Storage**: Saves presets automatically to `/config/www/styled-stack-card-presets/styled-stack-card-presets.js` using HA's native WebSocket API.
- 🔄 **Instant Synchronization**: Presets created in the manager immediately appear in `styled-stack-card`'s visual editor dropdown menu.
- 🌐 **Fully Local**: 100% local execution (`local_push`).

---

## 📋 Requirements

- **Home Assistant**: `2024.1.0` or newer
- **Styled Stack Card**: Custom dashboard card installed via HACS ([Repository](https://github.com/Mariocoleguilla/styled-stack-card))

---

## 🚀 Installation

### Option 1: HACS (Recommended)

1. Open **HACS** in your Home Assistant.
2. Click **Integrations** → Click **⋮ (top right) → Custom repositories**.
3. Add Repository URL:
   ```
   https://github.com/Mariocoleguilla/styled-stack-card-manager
   ```
   Category:
   ```
   Integration
   ```
4. Click **Download** and restart Home Assistant.
5. In Home Assistant, go to **Settings → Devices & Services → Add Integration**.
6. Search for **Styled Stack Card Manager** and click to complete setup.

---

### Option 2: Manual Installation

1. Copy the `styled_stack_card_manager` directory into your Home Assistant's `custom_components/` folder:
   ```
   config/custom_components/styled_stack_card_manager/
   ```
2. Restart Home Assistant.
3. Go to **Settings → Devices & Services → Add Integration** and select **Styled Stack Card Manager**.

---

## 📖 How It Works

1. Once installed, click **Styled Stack Card** in your Home Assistant sidebar.
2. Use the panel interface to create or edit gradient presets (set name, colors, alpha, angle, and optional mid-stop).
3. Click **Save Presets**. The integration writes the configuration to:
   ```
   /config/www/styled-stack-card-presets/styled-stack-card-presets.js
   ```
4. When editing any card in your dashboard using `styled-stack-card`, your custom presets will automatically appear in the preset dropdown (e.g. `✨ Chicle`).

---

## ⚙️ Configuration Example

Generated JS preset file format:

```javascript
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

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⭐ Support the Project

If this integration helps you manage and design your Home Assistant dashboards, consider giving the repository a **star** on GitHub!

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=C6T54AXECTX9L">
    <img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Donate via PayPal" />
  </a>
</p>
