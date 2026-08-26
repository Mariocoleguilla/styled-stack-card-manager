from homeassistant import config_entries
from homeassistant.core import HomeAssistant

DOMAIN = "styled_stack_card_manager"

class StyledStackManagerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        # Evitar que el usuario instale la integración dos veces
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            # Crea la integración en la interfaz
            return self.async_create_entry(title="Styled Stack Manager", data={})

        return self.async_show_form(step_id="user")