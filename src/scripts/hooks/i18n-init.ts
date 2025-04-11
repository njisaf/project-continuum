import { HomebrewElements } from "@system/settings/homebrew/menu.ts";

export const I18nInit = {
    listen: (): void => {
        Hooks.once("i18nInit", () => {
            game.avant.ConditionManager.initialize();
            // Assign the homebrew elements to their respective `CONFIG.AVANT` objects
            new HomebrewElements().onInit();
        });
    },
};
