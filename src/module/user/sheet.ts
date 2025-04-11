import { htmlQueryAll } from "@util";
import { ApplicationTab } from "types/foundry/client-esm/applications/_types.js";
import type { DocumentSheetRenderOptions } from "types/foundry/client-esm/applications/api/document-sheet.d.ts";
import { UserConfigData } from "types/foundry/client-esm/applications/sheets/user-config.js";
import type { UserAvant } from "./document.ts";

/** Player-specific settings, stored as flags on each User */
class UserConfigAvant extends foundry.applications.sheets.UserConfig<UserAvant> {
    static override PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
        },
        // Add a new main part, which embeds the original form part
        main: {
            template: "systems/avant/templates/user/sheet.hbs",
        },
        ...super.PARTS,
    };

    override tabGroups = {
        primary: "core",
    };

    #getTabs() {
        const DEFAULTS = { group: "primary" as const, active: false, cssClass: "" };
        const tabs = [
            { ...DEFAULTS, id: "core", icon: "fa-solid fa-user", label: "Core" },
            { ...DEFAULTS, id: "avant", icon: "fa-solid fa-dice", label: "System" },
        ];
        for (const tab of tabs) {
            tab.active = this.tabGroups[tab.group] === tab.id;
            tab.cssClass = tab.active ? "active" : "";
        }
        return tabs;
    }

    override async _prepareContext(options: DocumentSheetRenderOptions): Promise<UserConfigDataAvant> {
        const data = await super._prepareContext(options);

        // Remove party actors from the selection
        function createAdjustedCharacterWidget(...args: unknown[]) {
            const widget = data.characterWidget(...args);
            for (const option of htmlQueryAll(widget, "option")) {
                const actor = game.actors.get(option.value);
                if (actor?.isOfType("party")) {
                    option.remove();
                }
            }
            return widget;
        }

        return {
            ...data,
            tabGroups: this.tabGroups,
            tabs: this.#getTabs(),
            characterWidget: createAdjustedCharacterWidget,
        };
    }
}

interface UserConfigDataAvant extends UserConfigData<UserAvant> {
    tabs: Partial<ApplicationTab>[];
    tabGroups: Record<string, string>;
}

export { UserConfigAvant };
