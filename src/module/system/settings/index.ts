import { resetActors } from "@actor/helpers.ts";
import { ActorSheetAvant } from "@actor/sheet/base.ts";
import { ItemSheetAvant, type ItemAvant } from "@item";
import { RulerAvant } from "@module/canvas/ruler.ts";
import { StatusEffects } from "@module/canvas/status-effects.ts";
import { MigrationRunner } from "@module/migration/runner/index.ts";
import { isImageOrVideoPath, tupleHasValue } from "@util";
import { AutomationSettings } from "./automation.ts";
import { HomebrewElements } from "./homebrew/menu.ts";
import { MetagameSettings } from "./metagame.ts";
import { VariantRulesSettings } from "./variant-rules.ts";
import { WorldClockSettings } from "./world-clock.ts";

export function registerSettings(): void {
    if (BUILD_MODE === "development") {
        registerWorldSchemaVersion();
    }

    game.settings.register("avant", "tokens.autoscale", {
        name: "AVANT.SETTINGS.Tokens.Autoscale.Name",
        hint: "AVANT.SETTINGS.Tokens.Autoscale.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.tokens.autoscale = !!value;
        },
    });

    game.settings.register("avant", "identifyMagicNotMatchingTraditionModifier", {
        name: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Name",
        hint: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Hint",
        choices: {
            0: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Choices.0",
            2: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Choices.2",
            5: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Choices.5",
            10: "AVANT.SETTINGS.IdentifyMagicNotMatchingTraditionModifier.Choices.10",
        },
        type: Number,
        default: 5,
        scope: "world",
        config: true,
    });

    game.settings.register("avant", "critRule", {
        name: "AVANT.SETTINGS.CritRule.Name",
        hint: "AVANT.SETTINGS.CritRule.Hint",
        scope: "world",
        config: true,
        default: "doubledamage",
        type: String,
        choices: {
            doubledamage: "AVANT.SETTINGS.CritRule.Choices.Doubledamage",
            doubledice: "AVANT.SETTINGS.CritRule.Choices.Doubledice",
        },
        onChange: () => {
            for (const sheet of Object.values(ui.windows).filter((w) => w instanceof ActorSheetAvant)) {
                sheet.render();
            }
        },
    });

    game.settings.register("avant", "compendiumBrowserPacks", {
        name: "AVANT.SETTINGS.CompendiumBrowserPacks.Name",
        hint: "AVANT.SETTINGS.CompendiumBrowserPacks.Hint",
        default: {},
        type: Object,
        scope: "world",
        onChange: () => {
            game.avant.compendiumBrowser.initCompendiumList();
        },
    });

    game.settings.register("avant", "compendiumBrowserSources", {
        name: "AVANT.SETTINGS.compendiumBrowserSources.Name",
        hint: "AVANT.SETTINGS.compendiumBrowserSources.Hint",
        default: {
            ignoreAsGM: true,
            showEmptySources: true,
            showUnknownSources: true,
            sources: {},
        },
        type: Object,
        scope: "world",
        onChange: () => {
            game.avant.compendiumBrowser.packLoader.reset();
            game.avant.compendiumBrowser.initCompendiumList();
        },
    });

    game.settings.register("avant", "minimumRulesUI", {
        name: "AVANT.SETTINGS.MinimumRulesUI.Name",
        hint: "AVANT.SETTINGS.MinimumRulesUI.Hint",
        scope: "world",
        config: true,
        default: CONST.USER_ROLES.ASSISTANT,
        type: Number,
        choices: {
            1: "USER.RolePlayer",
            2: "USER.RoleTrusted",
            3: "USER.RoleAssistant",
            4: "USER.RoleGamemaster",
        },
        onChange: () => {
            const itemSheets = Object.values(ui.windows).filter(
                (w): w is ItemSheetAvant<ItemAvant> => w instanceof ItemSheetAvant,
            );
            for (const sheet of itemSheets) {
                sheet.render();
            }
        },
    });

    game.settings.register("avant", "critFumbleButtons", {
        name: game.i18n.localize("AVANT.SETTINGS.critFumbleCardButtons.name"),
        hint: game.i18n.localize("AVANT.SETTINGS.critFumbleCardButtons.hint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        requiresReload: true,
    });

    game.settings.register("avant", "drawCritFumble", {
        name: game.i18n.localize("AVANT.SETTINGS.critFumbleCards.name"),
        hint: game.i18n.localize("AVANT.SETTINGS.critFumbleCards.hint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.critFumble.cards = !!value;
        },
    });

    const iconChoices = {
        blackWhite: "AVANT.SETTINGS.statusEffectType.blackWhite",
        default: "AVANT.SETTINGS.statusEffectType.default",
    };
    game.settings.register("avant", "statusEffectType", {
        name: "AVANT.SETTINGS.statusEffectType.name",
        hint: "AVANT.SETTINGS.statusEffectType.hint",
        scope: "world",
        config: true,
        default: "default",
        type: String,
        choices: iconChoices,
        onChange: (iconType) => {
            StatusEffects.migrateStatusEffectUrls(iconType);
        },
    });

    game.settings.register("avant", "totmToggles", {
        name: "AVANT.SETTINGS.TOTMToggles.Name",
        hint: "AVANT.SETTINGS.TOTMToggles.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.totm = !!value;
            resetActors();
        },
    });

    game.settings.register("avant", "deathIcon", {
        name: "AVANT.SETTINGS.DeathIcon.Name",
        hint: "AVANT.SETTINGS.DeathIcon.Hint",
        scope: "world",
        config: false,
        default: "icons/svg/skull.svg",
        type: String,
        onChange: (choice) => {
            if (isImageOrVideoPath(choice)) {
                StatusEffects.reset();
            } else if (!choice) {
                game.settings.set("avant", "deathIcon", "icons/svg/skull.svg");
            }
        },
    });

    // Don't tell Nath
    game.settings.register("avant", "nathMode", {
        name: "AVANT.SETTINGS.NathMode.Name",
        hint: "AVANT.SETTINGS.NathMode.Hint",
        scope: "world",
        config: BUILD_MODE === "development",
        default: false,
        type: Boolean,
    });

    game.settings.register("avant", "statusEffectShowCombatMessage", {
        name: "AVANT.SETTINGS.statusEffectShowCombatMessage.name",
        hint: "AVANT.SETTINGS.statusEffectShowCombatMessage.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.registerMenu("avant", "automation", {
        name: "AVANT.SETTINGS.Automation.Name",
        label: "AVANT.SETTINGS.Automation.Label",
        hint: "AVANT.SETTINGS.Automation.Hint",
        icon: "fa-solid fa-robot",
        type: AutomationSettings,
        restricted: true,
    });
    game.settings.register("avant", "automation.actorsDeadAtZero", {
        name: CONFIG.AVANT.SETTINGS.automation.actorsDeadAtZero.name,
        scope: "world",
        config: false,
        choices: {
            neither: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Neither",
            npcsOnly: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.NPCsOnly",
            both: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Both",
        },
        default: "both",
        type: String,
    });
    AutomationSettings.registerSettings();

    game.settings.registerMenu("avant", "metagame", {
        name: "AVANT.SETTINGS.Metagame.Name",
        label: "AVANT.SETTINGS.Metagame.Label",
        hint: "AVANT.SETTINGS.Metagame.Hint",
        icon: "fa-solid fa-brain",
        type: MetagameSettings,
        restricted: true,
    });
    MetagameSettings.registerSettings();

    game.settings.registerMenu("avant", "variantRules", {
        name: "AVANT.SETTINGS.Variant.Name",
        label: "AVANT.SETTINGS.Variant.Label",
        hint: "AVANT.SETTINGS.Variant.Hint",
        icon: "fa-solid fa-book",
        type: VariantRulesSettings,
        restricted: true,
    });
    VariantRulesSettings.registerSettings();

    game.settings.registerMenu("avant", "homebrew", {
        name: "AVANT.SETTINGS.Homebrew.Name",
        label: "AVANT.SETTINGS.Homebrew.Label",
        hint: "AVANT.SETTINGS.Homebrew.Hint",
        icon: "fa-solid fa-beer-mug-empty",
        type: HomebrewElements,
        restricted: true,
    });
    HomebrewElements.registerSettings();

    game.settings.registerMenu("avant", "worldClock", {
        name: game.i18n.localize(CONFIG.AVANT.SETTINGS.worldClock.name),
        label: game.i18n.localize(CONFIG.AVANT.SETTINGS.worldClock.label),
        hint: game.i18n.localize(CONFIG.AVANT.SETTINGS.worldClock.hint),
        icon: "fa-regular fa-clock",
        type: WorldClockSettings,
        restricted: true,
    });
    WorldClockSettings.registerSettings();

    // Secret for now until the user side is complete and a UI is built
    game.settings.register("avant", "campaignFeatSections", {
        name: "Campaign Feat Sections",
        scope: "world",
        config: false,
        default: [],
        type: Array,
        onChange: (value) => {
            game.avant.settings.campaign.feats.sections = Array.isArray(value)
                ? value
                : game.avant.settings.campaign.feats.sections;
            resetActors(game.actors.filter((a) => a.isOfType("character")));
        },
    });

    // Increase brightness of darkness color for GMs
    game.settings.register("avant", "gmVision", {
        name: "AVANT.SETTINGS.GMVision",
        scope: "client",
        config: false,
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.gmVision = !!value;
            const color = value ? CONFIG.AVANT.Canvas.darkness.gmVision : CONFIG.AVANT.Canvas.darkness.default;
            CONFIG.Canvas.darknessColor = color;
            if (ui.controls && canvas.activeLayer) {
                ui.controls.initialize({ layer: canvas.activeLayer.constructor.layerOptions.name });
            }
            canvas.environment.initialize();
            canvas.perception.update({ initializeVision: true }, true);
        },
    });

    // Called from hook to ensure keybindings are available
    Hooks.once("canvasInit", () => {
        if (RulerAvant.hasModuleConflict) return;

        const placeWaypointKey = ((): string => {
            const action = game.keybindings.bindings.get("avant.placeWaypoint")?.at(0);
            return action ? KeybindingsConfig._humanizeBinding(action) : "";
        })();
        game.settings.register("avant", "dragMeasurement", {
            name: game.i18n.localize("AVANT.SETTINGS.DragMeasurement.Name"),
            hint: game.i18n.format("AVANT.SETTINGS.DragMeasurement.Hint", { key: placeWaypointKey }),
            scope: "world",
            config: true,
            type: String,
            default: "never",
            choices: {
                always: "AVANT.SETTINGS.DragMeasurement.Always",
                encounters: "AVANT.SETTINGS.DragMeasurement.Encounters",
                never: "AVANT.SETTINGS.DragMeasurement.Never",
            },
            onChange: (value) => {
                const options = ["always", "encounters", "never"] as const;
                game.avant.settings.dragMeasurement = tupleHasValue(options, value)
                    ? value
                    : game.avant.settings.dragMeasurement;
            },
        });
        game.avant.settings.dragMeasurement = game.settings.get("avant", "dragMeasurement");
    });

    game.settings.register("avant", "seenLastStopMessage", {
        name: "Seen Last Stop Before Remaster Message",
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
    });

    registerTrackingSettings();

    if (BUILD_MODE === "production") {
        registerWorldSchemaVersion();
    }
}

/** Registers temporary settings for tracking things like first time launches or active party */
function registerTrackingSettings(): void {
    // Whether the world's first party actor has been created
    game.settings.register("avant", "createdFirstParty", {
        name: "Created First Party", // Doesn't appear in any UI
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });

    game.settings.register("avant", "activeParty", {
        name: "Active Party",
        scope: "world",
        config: false,
        type: String,
        default: "",
        onChange: () => {
            ui.actors.render(true);
        },
    });

    // Tracks the last party folder state for next launch. Defaults to true so that "No Members" shows on initial creation.
    game.settings.register("avant", "activePartyFolderState", {
        name: "Active Party Opened or closed",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });

    game.settings.register("avant", "worldSystemVersion", {
        name: "World System Version",
        scope: "world",
        config: false,
        default: game.system.version,
        type: String,
    });

    // Show the GM information about the remaster
    game.settings.register("avant", "seenRemasterJournalEntry", {
        name: "Seen Remaster journal entry?",
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });
}

function registerWorldSchemaVersion(): void {
    game.settings.register("avant", "worldSchemaVersion", {
        name: "AVANT.SETTINGS.WorldSchemaVersion.Name",
        hint: "AVANT.SETTINGS.WorldSchemaVersion.Hint",
        scope: "world",
        config: true,
        default: MigrationRunner.LATEST_SCHEMA_VERSION,
        type: Number,
        requiresReload: true,
    });
}
