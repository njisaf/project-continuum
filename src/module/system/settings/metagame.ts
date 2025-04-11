import { resetActors } from "@actor/helpers.ts";
import { PartialSettingsData, SettingsMenuAvant } from "./menu.ts";

const MetagameSettingsConfig = {
    showDC: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.ShowDC.Name",
        hint: "AVANT.SETTINGS.Metagame.ShowDC.Hint",
        default: false,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.dcs = !!value;
        },
    },
    showResults: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.ShowResults.Name",
        hint: "AVANT.SETTINGS.Metagame.ShowResults.Hint",
        default: true,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.results = !!value;
        },
    },
    showBreakdowns: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.ShowBreakdowns.Name",
        hint: "AVANT.SETTINGS.Metagame.ShowBreakdowns.Hint",
        default: false,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.breakdowns = !!value;
        },
    },
    secretDamage: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.SecretDamage.Name",
        hint: "AVANT.SETTINGS.Metagame.SecretDamage.Hint",
        default: false,
        type: Boolean,
    },
    secretCondition: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.SecretCondition.Name",
        hint: "AVANT.SETTINGS.Metagame.SecretCondition.Hint",
        default: false,
        type: Boolean,
    },
    partyVision: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.PartyVision.Name",
        hint: "AVANT.SETTINGS.Metagame.PartyVision.Hint",
        default: false,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.partyVision = !!value;
            if (canvas.ready && canvas.scene) {
                canvas.perception.update({ initializeVision: true, refreshLighting: true }, true);
            }
        },
    },
    showPartyStats: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.ShowPartyStats.Name",
        hint: "AVANT.SETTINGS.Metagame.ShowPartyStats.Hint",
        default: true,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.partyStats = !!value;
            resetActors(game.actors.filter((a) => a.isOfType("party")));
        },
    },
    tokenSetsNameVisibility: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.TokenSetsNameVisibility.Name",
        hint: "AVANT.SETTINGS.Metagame.TokenSetsNameVisibility.Hint",
        default: false,
        type: Boolean,
        onChange: async (value: unknown) => {
            game.avant.settings.tokens.nameVisibility = !!value;
            ui.combat.render();
            const renderedMessages = document.querySelectorAll<HTMLLIElement>("#chat-log > li");
            for (const rendered of Array.from(renderedMessages)) {
                const message = game.messages.get(rendered?.dataset.messageId ?? "");
                if (!message) continue;
                await ui.chat.updateMessage(message);
            }
        },
    },
    secretChecks: {
        prefix: "metagame_",
        name: "AVANT.SETTINGS.Metagame.SecretChecks.Name",
        hint: "AVANT.SETTINGS.Metagame.SecretChecks.Hint",
        default: false,
        type: Boolean,
        onChange: (value: unknown) => {
            game.avant.settings.metagame.secretChecks = !!value;
        },
    },
} satisfies Record<string, PartialSettingsData>;

class MetagameSettings extends SettingsMenuAvant {
    static override namespace = "metagame";

    static override get settings(): typeof MetagameSettingsConfig {
        return MetagameSettingsConfig;
    }

    static override get SETTINGS(): string[] {
        return Object.keys(this.settings);
    }
}

export { MetagameSettings };
