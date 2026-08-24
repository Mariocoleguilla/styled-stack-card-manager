import os
import json
from homeassistant.components import panel_custom, websocket_api
from homeassistant.core import HomeAssistant

DOMAIN = "styled_stack_card_manager"

async def async_setup(hass: HomeAssistant, config: dict):
    # 1. Registrar el panel en la barra lateral
    hass.http.register_static_path(
        "/styled_stack_card_manager_ui", 
        hass.config.path(f"custom_components/{DOMAIN}/www/panel.js")
    )
    
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path="styled-stack-card-manager", # URL en el navegador
        webcomponent_name="styled-stack-card-panel",   # Nombre del componente LitElement
        sidebar_title="Styled Stack Card",             # Nombre en la barra lateral
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
        
        # Generar el contenido del JS
        js_content = f"window.StyledStackCustomPresets = {json.dumps(presets_data, indent=2)};"
        
        # Guardar en /config/www/styled-stack-presets.js
        file_path = hass.config.path("www", "styled-stack-presets.js")
        
        def write_file():
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(js_content)
                
        await hass.async_add_executor_job(write_file)
        
        connection.send_result(msg["id"], {"success": True})

    hass.components.websocket_api.async_register_command(handle_save_presets)

    return True