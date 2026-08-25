import os
import json
from homeassistant.components import panel_custom, websocket_api, frontend
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import StaticPathConfig

DOMAIN = "styled_stack_card_manager"

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry): 
    # 1. Registrar el panel en la barra lateral
    url_path = "/styled_stack_card_manager_ui"
    file_path = hass.config.path(f"custom_components/{DOMAIN}/www/panel.js")
    
    await hass.http.async_register_static_paths([
        StaticPathConfig(url_path, file_path, False)
    ])
    
    # ¡NUEVO! Comprobación de seguridad: Si el panel ya estaba cargado, lo quitamos antes de poner el nuevo
    if "styled-stack-card-manager" in hass.data.get("frontend_panels", {}):
        frontend.async_remove_panel(hass, "styled-stack-card-manager")
        
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
        
        # AQUÍ ESTÁ LA CLAVE: 3 parámetros (carpeta base, subcarpeta, nombre del archivo)
        file_path_js = hass.config.path("www", "styled-stack-card-presets", "styled-stack-card-presets.js")
        
        def write_file():
            # Esto sacará la ruta de la carpeta (/config/www/styled-stack-card-presets)
            folder_path = os.path.dirname(file_path_js)
            # Esto crea la subcarpeta si no existe
            os.makedirs(folder_path, exist_ok=True)
            
            # Esto crea y escribe el archivo .js dentro
            with open(file_path_js, "w", encoding="utf-8") as f:
                f.write(js_content)
                
        await hass.async_add_executor_job(write_file)
        connection.send_result(msg["id"], {"success": True})

    websocket_api.async_register_command(hass, handle_save_presets)

    return True

# ¡NUEVO! Función obligatoria para limpiar cuando se borra/recarga la integración
async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    # Quitamos el panel de la barra lateral al desinstalar
    frontend.async_remove_panel(hass, "styled-stack-card-manager")
    return True