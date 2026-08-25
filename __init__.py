import os
import json
from homeassistant.components import panel_custom, websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import StaticPathConfig  # <-- NUEVA IMPORTACIÓN

DOMAIN = "styled_stack_card_manager"

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry): 
    # 1. Registrar el panel en la barra lateral usando el método asíncrono moderno
    url_path = "/styled_stack_card_manager_ui"
    file_path = hass.config.path(f"custom_components/{DOMAIN}/www/panel.js")
    
    await hass.http.async_register_static_paths([
        StaticPathConfig(url_path, file_path, False) # False = sin caché (ideal para desarrollo)
    ])
    
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path="styled-stack-card-manager",
        webcomponent_name="styled-stack-card-panel",
        sidebar_title="Styled Stack Card",
        sidebar_icon="mdi:view-dashboard-variant",
        module_url="/styled_stack_card_manager_ui"
    )

    # 2. Crear un comando WebSocket para guardar los presets
    @websocket_api.websocket_command({
        "type": "styled_stack_card/save_presets",
        "presets": dict
    })
    @websocket_api.async_response
    async def handle_save_presets(hass: HomeAssistant, connection, msg):
        presets_data = msg["presets"]
        
        js_content = f"window.StyledStackCustomPresets = {json.dumps(presets_data, indent=2)};"
        file_path_js = hass.config.path("www", "styled-stack-presets.js")
        
        def write_file():
            os.makedirs(os.path.dirname(file_path_js), exist_ok=True)
            with open(file_path_js, "w", encoding="utf-8") as f:
                f.write(js_content)
                
        await hass.async_add_executor_job(write_file)
        connection.send_result(msg["id"], {"success": True})

    # Registramos el websocket
    hass.components.websocket_api.async_register_command(handle_save_presets)

    return True