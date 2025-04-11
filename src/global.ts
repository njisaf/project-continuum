/// <reference types="vite/client" />

import type { ActorAvant } from "@actor";
import type { Action } from "@actor/actions/index.ts";
import type { AutomaticBonusProgression } from "@actor/character/automatic-bonus-progression.ts";
import type { ElementalBlast } from "@actor/character/elemental-blast.ts";
import type { FeatGroupData } from "@actor/character/feats/index.ts";
import type { CheckModifier, ModifierAvant, ModifierType, StatisticModifier } from "@actor/modifiers.ts";
import type { ItemAvant, PhysicalItemAvant } from "@item";
import type { ConditionSource } from "@item/condition/data.ts";
import type { CoinsAvant } from "@item/physical/helpers.ts";
import type { ActiveEffectAvant } from "@module/active-effect.ts";
import type {
    CompendiumBrowser,
    CompendiumBrowserSettings,
    CompendiumBrowserSources,
} from "@module/apps/compendium-browser/browser.ts";
import type { EffectsPanel } from "@module/apps/effects-panel.ts";
import type { HotbarAvant } from "@module/apps/hotbar.ts";
import type { LicenseViewer } from "@module/apps/license-viewer/app.ts";
import type {
    ActorDirectoryAvant,
    ChatLogAvant,
    CompendiumDirectoryAvant,
    EncounterTrackerAvant,
} from "@module/apps/sidebar/index.ts";
import type { WorldClock } from "@module/apps/world-clock/app.ts";
import type { CanvasAvant, EffectsCanvasGroupAvant } from "@module/canvas/index.ts";
import type { StatusEffects } from "@module/canvas/status-effects.ts";
import type { ChatMessageAvant } from "@module/chat-message/index.ts";
import type { ActorsAvant } from "@module/collection/actors.ts";
import type { CombatantAvant, EncounterAvant } from "@module/encounter/index.ts";
import type { MacroAvant } from "@module/macro.ts";
import type { RuleElementAvant, RuleElements } from "@module/rules/index.ts";
import type { UserAvant } from "@module/user/index.ts";
import type {
    AmbientLightDocumentAvant,
    MeasuredTemplateDocumentAvant,
    RegionBehaviorAvant,
    RegionDocumentAvant,
    SceneAvant,
    TileDocumentAvant,
    TokenDocumentAvant,
} from "@scene";
import type { ActorDeltaAvant } from "@scene/token-document/actor-delta.ts";
import type { AVANTCONFIG, StatusEffectIconTheme } from "@scripts/config/index.ts";
import type { DiceAvant } from "@scripts/dice.ts";
import type {
    calculateXP,
    checkPrompt,
    editPersistent,
    launchTravelSheet,
    perceptionForSelected,
    rollActionMacro,
    rollItemMacro,
    stealthForSelected,
    xpFromEncounter,
} from "@scripts/macros/index.ts";
import type { remigrate } from "@scripts/system/remigrate.ts";
import type { CheckAvant } from "@system/check/index.ts";
import type { ConditionManager } from "@system/conditions/manager.ts";
import type { EffectTracker } from "@system/effect-tracker.ts";
import type { ModuleArt } from "@system/module-art.ts";
import type { Predicate } from "@system/predication.ts";
import type {
    CustomDamageData,
    HomebrewTag,
    HomebrewTraitSettingsKey,
    LanguageSettings,
} from "@system/settings/homebrew/index.ts";
import type { TextEditorAvant } from "@system/text-editor.ts";
import type { sluggify } from "@util";
import type EnJSON from "static/lang/en.json";

interface GameAvant
    extends Game<
        ActorAvant<null>,
        ActorsAvant<ActorAvant<null>>,
        ChatMessageAvant,
        EncounterAvant,
        ItemAvant<null>,
        MacroAvant,
        SceneAvant,
        UserAvant
    > {
    avant: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        actions: Record<string, Function> & Collection<Action>;
        compendiumBrowser: CompendiumBrowser;
        licenseViewer: LicenseViewer;
        worldClock: WorldClock;
        effectPanel: EffectsPanel;
        effectTracker: EffectTracker;
        rollActionMacro: typeof rollActionMacro;
        rollItemMacro: typeof rollItemMacro;
        gm: {
            calculateXP: typeof calculateXP;
            checkPrompt: typeof checkPrompt;
            editPersistent: typeof editPersistent;
            launchTravelSheet: typeof launchTravelSheet;
            perceptionForSelected: typeof perceptionForSelected;
            stealthForSelected: typeof stealthForSelected;
            xpFromEncounter: typeof xpFromEncounter;
        };
        system: {
            moduleArt: ModuleArt;
            remigrate: typeof remigrate;
            sluggify: typeof sluggify;
            generateItemName: (item: PhysicalItemAvant) => string;
        };
        variantRules: {
            AutomaticBonusProgression: typeof AutomaticBonusProgression;
        };
        Check: typeof CheckAvant;
        CheckModifier: typeof CheckModifier;
        Coins: typeof CoinsAvant;
        ConditionManager: typeof ConditionManager;
        Dice: typeof DiceAvant;
        ElementalBlast: typeof ElementalBlast;
        Modifier: typeof ModifierAvant;
        ModifierType: { [K in Uppercase<ModifierType>]: Lowercase<K> };
        Predicate: typeof Predicate;
        RuleElement: typeof RuleElementAvant;
        RuleElements: typeof RuleElements;
        StatisticModifier: typeof StatisticModifier;
        StatusEffects: typeof StatusEffects;
        TextEditor: typeof TextEditorAvant;
        /** Cached values of frequently-checked settings */
        settings: {
            automation: {
                /** Flanking detection */
                flanking: boolean;
            };
            /** Campaign feat slots */
            campaign: {
                feats: {
                    enabled: boolean;
                    sections: FeatGroupData[];
                };
                languages: LanguageSettings;
                mythic: "disabled" | "enabled" | "variant-tiers";
                type: string | null;
            };
            critFumble: {
                buttons: boolean;
                cards: boolean;
            };
            dragMeasurement: "always" | "encounters" | "never";
            /** Encumbrance automation */
            encumbrance: boolean;
            gmVision: boolean;
            /** Immunities, weaknesses, and resistances */
            iwr: boolean;
            metagame: {
                breakdowns: boolean;
                dcs: boolean;
                secretChecks: boolean;
                partyStats: boolean;
                partyVision: boolean;
                results: boolean;
            };
            /** Rules-based vision */
            rbv: boolean;
            tokens: {
                /** Automatic scaling of tokens belong to small actor */
                autoscale: boolean;
                /** Token nameplate visibility sets name visibility in encounter tracker */
                nameVisibility: boolean;
                /** Nath Mode */
                nathMode: boolean;
            };
            /** Theater-of-the-mind toggles */
            totm: boolean;
            /** Variant urles */
            variants: {
                /** Automatic Bonus Progression */
                abp: "noABP" | "ABPFundamentalPotency" | "ABPRulesAsWritten";
                /** Free Archetype */
                fa: boolean;
                /** Gradual Ability Boosts */
                gab: boolean;
                /** Proficiency without Level */
                pwol: {
                    enabled: boolean;
                    /** Modifiers for each proficiency rank */
                    modifiers: [number, number, number, number, number];
                };
                /** Stamina */
                stamina: boolean;
            };
        };
    };
}

type ConfiguredConfig = Config<
    AmbientLightDocumentAvant<SceneAvant | null>,
    ActiveEffectAvant<ActorAvant | ItemAvant | null>,
    ActorAvant,
    ActorDeltaAvant<TokenDocumentAvant>,
    ChatLogAvant,
    ChatMessageAvant,
    EncounterAvant,
    CombatantAvant<EncounterAvant | null, TokenDocumentAvant>,
    EncounterTrackerAvant<EncounterAvant | null>,
    CompendiumDirectoryAvant,
    HotbarAvant,
    ItemAvant,
    MacroAvant,
    MeasuredTemplateDocumentAvant,
    RegionDocumentAvant,
    RegionBehaviorAvant,
    TileDocumentAvant,
    TokenDocumentAvant,
    WallDocument<SceneAvant | null>,
    SceneAvant,
    UserAvant,
    EffectsCanvasGroupAvant
>;

declare global {
    interface ConfigAvant extends ConfiguredConfig {
        debug: ConfiguredConfig["debug"] & {
            ruleElement: boolean;
        };
        AVANT: typeof AVANTCONFIG;
        time: {
            roundTime: number;
            turnTime: number;
        };
    }

    const CONFIG: ConfigAvant;
    const canvas: CanvasAvant;

    namespace globalThis {
        // eslint-disable-next-line no-var
        var game: GameAvant;
        // eslint-disable-next-line no-var
        var fu: typeof foundry.utils;

        // eslint-disable-next-line no-var
        var ui: FoundryUI<
            ActorDirectoryAvant,
            ItemDirectory<ItemAvant<null>>,
            ChatLogAvant,
            CompendiumDirectoryAvant,
            EncounterTrackerAvant<EncounterAvant | null>,
            HotbarAvant
        >;

        // Add functions to the `Math` namespace for use in `Roll` formulas
        interface Math {
            eq: (a: number, b: number) => boolean;
            gt: (a: number, b: number) => boolean;
            gte: (a: number, b: number) => boolean;
            lt: (a: number, b: number) => boolean;
            lte: (a: number, b: number) => boolean;
            ne: (a: number, b: number) => boolean;
            ternary: (condition: boolean | number, ifTrue: number, ifFalse: number) => number;
        }
    }

    interface Window {
        AutomaticBonusProgression: typeof AutomaticBonusProgression;
    }

    interface ClientSettings {
        get(module: "avant", setting: "automation.actorsDeadAtZero"): "neither" | "npcsOnly" | "pcsOnly" | "both";
        get(module: "avant", setting: "automation.effectExpiration"): boolean;
        get(module: "avant", setting: "automation.encumbrance"): boolean;
        get(module: "avant", setting: "automation.flankingDetection"): boolean;
        get(module: "avant", setting: "automation.iwr"): boolean;
        get(module: "avant", setting: "automation.lootableNPCs"): boolean;
        get(module: "avant", setting: "automation.removeExpiredEffects"): boolean;
        get(module: "avant", setting: "automation.rulesBasedVision"): boolean;

        get(module: "avant", setting: "gradualBoostsVariant"): boolean;
        get(module: "avant", setting: "automaticBonusVariant"): "noABP" | "ABPFundamentalPotency" | "ABPRulesAsWritten";
        get(module: "avant", setting: "freeArchetypeVariant"): boolean;
        get(module: "avant", setting: "proficiencyVariant"): boolean;
        get(module: "avant", setting: "staminaVariant"): boolean;

        get(module: "avant", setting: "proficiencyUntrainedModifier"): number;
        get(module: "avant", setting: "proficiencyTrainedModifier"): number;
        get(module: "avant", setting: "proficiencyExpertModifier"): number;
        get(module: "avant", setting: "proficiencyMasterModifier"): number;
        get(module: "avant", setting: "proficiencyLegendaryModifier"): number;

        get(module: "avant", setting: "metagame_partyVision"): boolean;
        get(module: "avant", setting: "metagame_secretCondition"): boolean;
        get(module: "avant", setting: "metagame_secretDamage"): boolean;
        get(module: "avant", setting: "metagame_showBreakdowns"): boolean;
        get(module: "avant", setting: "metagame_showDC"): boolean;
        get(module: "avant", setting: "metagame_showPartyStats"): boolean;
        get(module: "avant", setting: "metagame_showResults"): boolean;
        get(module: "avant", setting: "metagame_tokenSetsNameVisibility"): boolean;
        get(module: "avant", setting: "metagame_secretChecks"): boolean;

        get(module: "avant", setting: "tokens.autoscale"): boolean;

        get(module: "avant", setting: "worldClock.dateTheme"): "AR" | "IC" | "AD" | "CE";
        get(module: "avant", setting: "worldClock.playersCanView"): boolean;
        get(module: "avant", setting: "worldClock.showClockButton"): boolean;
        get(module: "avant", setting: "worldClock.syncDarkness"): boolean;
        get(module: "avant", setting: "worldClock.timeConvention"): 24 | 12;
        get(module: "avant", setting: "worldClock.worldCreatedOn"): string;

        get(module: "avant", setting: "campaignFeats"): boolean;
        get(module: "avant", setting: "campaignFeatSections"): FeatGroupData[];
        get(module: "avant", setting: "campaignType"): string;
        get(module: "avant", setting: "mythic"): "disabled" | "enabled" | "variant-tiers";

        get(module: "avant", setting: "activeParty"): string;
        get(module: "avant", setting: "activePartyFolderState"): boolean;
        get(module: "avant", setting: "createdFirstParty"): boolean;

        get(module: "avant", setting: "homebrew.languages"): HomebrewTag<"languages">[];
        get(module: "avant", setting: "homebrew.weaponCategories"): HomebrewTag<"weaponCategories">[];
        get(module: "avant", setting: HomebrewTraitSettingsKey): HomebrewTag[];
        get(module: "avant", setting: "homebrew.damageTypes"): CustomDamageData[];
        get(module: "avant", setting: "homebrew.languageRarities"): LanguageSettings;

        get(module: "avant", setting: "compendiumBrowserPacks"): CompendiumBrowserSettings;
        get(module: "avant", setting: "compendiumBrowserSources"): CompendiumBrowserSources;
        get(module: "avant", setting: "critFumbleButtons"): boolean;
        get(module: "avant", setting: "critRule"): "doubledamage" | "doubledice";
        get(module: "avant", setting: "deathIcon"): ImageFilePath;
        get(module: "avant", setting: "dragMeasurement"): "always" | "encounters" | "never";
        get(module: "avant", setting: "drawCritFumble"): boolean;
        get(module: "avant", setting: "gmVision"): boolean;
        get(module: "avant", setting: "identifyMagicNotMatchingTraditionModifier"): 0 | 2 | 5 | 10;
        get(module: "avant", setting: "minimumRulesUI"): Exclude<UserRole, 0>;
        get(module: "avant", setting: "nathMode"): boolean;
        get(module: "avant", setting: "seenRemasterJournalEntry"): boolean;
        get(module: "avant", setting: "statusEffectType"): StatusEffectIconTheme;
        get(module: "avant", setting: "totmToggles"): boolean;
        get(module: "avant", setting: "worldSchemaVersion"): number;
        get(module: "avant", setting: "worldSystemVersion"): string;
    }

    interface ClientSettingsMap {
        get(key: "avant.worldClock.worldCreatedOn"): SettingConfig & { default: string };
    }

    interface RollMathProxy {
        eq: (a: number, b: number) => boolean;
        gt: (a: number, b: number) => boolean;
        gte: (a: number, b: number) => boolean;
        lt: (a: number, b: number) => boolean;
        lte: (a: number, b: number) => boolean;
        ne: (a: number, b: number) => boolean;
        ternary: (condition: boolean | number, ifTrue: number, ifFalse: number) => number;
    }

    const BUILD_MODE: "development" | "production";
    const CONDITION_SOURCES: ConditionSource[];
    const EN_JSON: typeof EnJSON;
    const ROLL_PARSER: string;
    const UUID_REDIRECTS: Record<CompendiumUUID, CompendiumUUID>;
}
