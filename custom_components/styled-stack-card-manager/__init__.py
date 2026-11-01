"""Styled Stack Card Manager: panel lateral y API WebSocket para presets de degradado."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "styled_stack_card_manager"

PANEL_URL_PATH = "styled-stack-card-manager"
PANEL_STATIC_URL = "/styled_stack_card_manager_ui"

# Evento interno del bus de HA. Se mantiene por compatibilidad con versiones
# antiguas de la tarjeta, que se suscriben a él con `subscribe_events`
# (solo funciona para administradores).
EVENT_PRESETS_UPDATED = "styled_stack_card_presets_updated"

WS_TYPE_SAVE_PRESETS = "styled_stack_card/save_presets"
WS_TYPE_SUBSCRIBE_PRESETS = "styled_stack_card/subscribe_presets"

JS_PREFIX = "window.StyledStackCustomPresets = "

DATA_PRESETS = "presets"
DATA_STATIC_REGISTERED = "static_registered"

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


def _presets_file_path(hass: HomeAssistant) -> str:
    return hass.config.path(
        "www", "styled-stack-card-presets", "styled-stack-card-presets.js"
    )


def _read_presets_file(path: str) -> dict[str, Any]:
    """Lee el archivo JS de presets y devuelve el dict (vacío si no existe o no se entiende)."""
    try:
        with open(path, encoding="utf-8") as file:
            content = file.read().strip()
    except FileNotFoundError:
        return {}
    except OSError as err:
        _LOGGER.warning("No se pudo leer %s: %s", path, err)
        return {}

    if content.startswith(JS_PREFIX):
        content = content[len(JS_PREFIX) :]
    content = content.rstrip().rstrip(";")
    try:
        data = json.loads(content)
    except ValueError:
        _LOGGER.warning(
            "%s no tiene el formato esperado; se ignora para la sincronización en vivo",
            path,
        )
        return {}
    return data if isinstance(data, dict) else {}


def _write_presets_file(path: str, presets: dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        file.write(f"{JS_PREFIX}{json.dumps(presets, indent=2)};")


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_SAVE_PRESETS,
        vol.Required("presets"): dict,
    }
)
@websocket_api.async_response
async def ws_save_presets(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Guarda los presets. Abierto a cualquier usuario autenticado (intencionado)."""
    presets: dict[str, Any] = msg["presets"]

    await hass.async_add_executor_job(
        _write_presets_file, _presets_file_path(hass), presets
    )
    hass.data.setdefault(DOMAIN, {})[DATA_PRESETS] = presets

    # Notifica a las suscripciones de `subscribe_presets` (y a tarjetas antiguas).
    hass.bus.async_fire(EVENT_PRESETS_UPDATED, {"presets": presets})

    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_SUBSCRIBE_PRESETS,
    }
)
@callback
def ws_subscribe_presets(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Suscripción a cambios de presets. Abierta a cualquier usuario autenticado.

    `subscribe_events` solo admite eventos personalizados para administradores
    (SUBSCRIBE_ALLOWLIST), por eso exponemos un comando propio que reenvía el
    evento interno a cada conexión suscrita.
    """
    msg_id = msg["id"]

    @callback
    def forward_presets(event: Event) -> None:
        connection.send_message(
            websocket_api.event_message(
                msg_id, {"presets": event.data.get("presets") or {}}
            )
        )

    connection.subscriptions[msg_id] = hass.bus.async_listen(
        EVENT_PRESETS_UPDATED, forward_presets
    )
    connection.send_result(msg_id)

    # Envía enseguida los presets actuales para que el cliente no tenga que
    # descargar el archivo JS.
    connection.send_message(
        websocket_api.event_message(
            msg_id, {"presets": hass.data.get(DOMAIN, {}).get(DATA_PRESETS, {})}
        )
    )


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Registra los comandos WebSocket y carga los presets guardados.

    Se hace aquí (y no en async_setup_entry) para que los comandos existan en
    cuanto HA marca la integración como cargada: el frontend reconecta durante
    el arranque y se suscribe enseguida. Ninguno requiere admin (intencionado).
    """
    hass.data.setdefault(DOMAIN, {})[DATA_PRESETS] = await hass.async_add_executor_job(
        _read_presets_file, _presets_file_path(hass)
    )
    websocket_api.async_register_command(hass, ws_save_presets)
    websocket_api.async_register_command(hass, ws_subscribe_presets)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Configura la integración desde la entrada de configuración."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    # 1. Panel lateral (abierto a cualquier usuario autenticado: intencionado).
    if not domain_data.get(DATA_STATIC_REGISTERED):
        panel_js = os.path.join(os.path.dirname(__file__), "www", "panel.js")
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_STATIC_URL, panel_js, False)]
        )
        domain_data[DATA_STATIC_REGISTERED] = True

    if PANEL_URL_PATH in hass.data.get("frontend_panels", {}):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)

    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name="styled-stack-card-panel",
        sidebar_title="Styled Stack Card",
        sidebar_icon="mdi:gradient-horizontal",
        module_url=PANEL_STATIC_URL,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Descarga la integración."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return True
