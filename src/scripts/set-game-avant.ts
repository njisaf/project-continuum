import { Action } from "@actor/actions/index.ts";
import { AutomaticBonusProgression } from "@actor/character/automatic-bonus-progression.ts";
import { ElementalBlast } from "@actor/character/elemental-blast.ts";
import { CheckModifier, ModifierAvant, StatisticModifier } from "@actor/modifiers.ts";
import { CoinsAvant, generateItemName } from "@item/physical/helpers.ts";
import { CompendiumBrowser } from "@module/apps/compendium-browser/browser.ts";
import { EffectsPanel } from "@module/apps/effects-panel.ts";
import { LicenseViewer } from "@module/apps/license-viewer/app.ts";
import { WorldClock } from "@module/apps/world-clock/index.ts";
import { StatusEffects } from "@module/canvas/status-effects.ts";
import { RuleElementAvant, RuleElements } from "@module/rules/index.ts";
import { DiceAvant } from "@scripts/dice.ts";
import {
    calculateXP,
    checkPrompt,
    editPersistent,
    encouragingWords,
    launchTravelSheet,
    perceptionForSelected,
    raiseAShield,
    restForTheNight,
    rollActionMacro,
    rollItemMacro,
    showEarnIncomePopup,
    stealthForSelected,
    steelYourResolve,
    takeABreather,
    treatWounds,
    xpFromEncounter,
} from "@scripts/macros/index.ts";
import { remigrate } from "@scripts/system/remigrate.ts";
import { ActionMacros, SystemActions } from "@system/action-macros/index.ts";
import { CheckAvant } from "@system/check/check.ts";
import { ConditionManager } from "@system/conditions/index.ts";
import { EffectTracker } from "@system/effect-tracker.ts";
import { ModuleArt } from "@system/module-art.ts";
import { Predicate } from "@system/predication.ts";
import { TextEditorAvant } from "@system/text-editor.ts";
import { sluggify } from "@util";

/** Expose public game.avant interface */
export const SetGameAvant = {
    onInit: (): void => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        type ActionCollection = Record<string, Function> & Collection<Action>;
        const actions = new Collection<Action>(
            SystemActions.map((action) => [action.slug, action]),
        ) as ActionCollection;
        // keep the old action functions around until everything has been converted
        for (const [name, action] of Object.entries({
            encouragingWords,
            raiseAShield,
            restForTheNight,
            earnIncome: showEarnIncomePopup,
            steelYourResolve,
            takeABreather,
            treatWounds,
            ...ActionMacros,
        })) {
            actions[name] = action;
        }

        const MODIFIER_TYPE = {
            ABILITY: "ability",
            PROFICIENCY: "proficiency",
            CIRCUMSTANCE: "circumstance",
            ITEM: "item",
            POTENCY: "potency",
            STATUS: "status",
            UNTYPED: "untyped",
        } as const;

        const initSafe: Partial<(typeof game)["avant"]> = {
            Check: CheckAvant,
            CheckModifier,
            Coins: CoinsAvant,
            ConditionManager,
            Dice: DiceAvant,
            ElementalBlast,
            Modifier: ModifierAvant,
            ModifierType: MODIFIER_TYPE,
            Predicate: Predicate,
            RuleElement: RuleElementAvant,
            RuleElements: RuleElements,
            StatisticModifier: StatisticModifier,
            StatusEffects: StatusEffects,
            TextEditor: TextEditorAvant,
            actions,
            effectPanel: new EffectsPanel(),
            effectTracker: new EffectTracker(),
            gm: {
                calculateXP,
                checkPrompt,
                editPersistent,
                launchTravelSheet,
                perceptionForSelected,
                stealthForSelected,
                xpFromEncounter,
            },
            licenseViewer: new LicenseViewer(),
            rollActionMacro,
            rollItemMacro,
            system: { generateItemName, moduleArt: new ModuleArt(), remigrate, sluggify },
            variantRules: { AutomaticBonusProgression },
        };
        game.avant = fu.mergeObject(game.avant ?? {}, initSafe);

        const campaignType = game.settings.get("avant", "campaignType");
        game.avant.settings = {
            automation: {
                flanking: game.settings.get("avant", "automation.flankingDetection"),
            },
            campaign: {
                feats: {
                    enabled: game.settings.get("avant", "campaignFeats"),
                    sections: game.settings.get("avant", "campaignFeatSections"),
                },
                languages: game.settings.get("avant", "homebrew.languageRarities"),
                mythic: game.settings.get("avant", "mythic"),
                type: campaignType === "none" ? null : campaignType,
            },
            critFumble: {
                buttons: game.settings.get("avant", "critFumbleButtons"),
                cards: game.settings.get("avant", "drawCritFumble"),
            },
            dragMeasurement: "never", // set in canvasInit hook
            encumbrance: game.settings.get("avant", "automation.encumbrance"),
            gmVision: game.settings.get("avant", "gmVision"),
            iwr: game.settings.get("avant", "automation.iwr"),
            metagame: {
                breakdowns: game.settings.get("avant", "metagame_showBreakdowns"),
                dcs: game.settings.get("avant", "metagame_showDC"),
                secretChecks: game.settings.get("avant", "metagame_secretChecks"),
                partyStats: game.settings.get("avant", "metagame_showPartyStats"),
                partyVision: game.settings.get("avant", "metagame_partyVision"),
                results: game.settings.get("avant", "metagame_showResults"),
            },
            rbv: game.settings.get("avant", "automation.rulesBasedVision"),
            tokens: {
                autoscale: game.settings.get("avant", "tokens.autoscale"),
                nameVisibility: game.settings.get("avant", "metagame_tokenSetsNameVisibility"),
                nathMode: game.settings.get("avant", "nathMode"),
            },
            totm: game.settings.get("avant", "totmToggles"),
            variants: {
                abp: game.settings.get("avant", "automaticBonusVariant"),
                fa: game.settings.get("avant", "freeArchetypeVariant"),
                gab: game.settings.get("avant", "gradualBoostsVariant"),
                pwol: {
                    enabled: game.settings.get("avant", "proficiencyVariant"),
                    modifiers: [
                        game.settings.get("avant", "proficiencyUntrainedModifier"),
                        game.settings.get("avant", "proficiencyTrainedModifier"),
                        game.settings.get("avant", "proficiencyExpertModifier"),
                        game.settings.get("avant", "proficiencyMasterModifier"),
                        game.settings.get("avant", "proficiencyLegendaryModifier"),
                    ],
                },
                stamina: game.settings.get("avant", "staminaVariant"),
            },
        };
    },

    onSetup: (): void => {},

    onReady: (): void => {
        game.avant.compendiumBrowser = new CompendiumBrowser();
        game.avant.worldClock = new WorldClock();
    },
};
