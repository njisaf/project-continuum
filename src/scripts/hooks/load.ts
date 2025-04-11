import { ActorProxyAvant } from "@actor";
import { ArmySystemData } from "@actor/army/data.ts";
import { AutomaticBonusProgression } from "@actor/character/automatic-bonus-progression.ts";
import { FamiliarSystemData } from "@actor/familiar/data.ts";
import { HazardSystemData } from "@actor/hazard/data.ts";
import { resetActors } from "@actor/helpers.ts";
import { LootSystemData } from "@actor/loot/data.ts";
import { PartySystemData } from "@actor/party/data.ts";
import { ActorSheetAvant } from "@actor/sheet/base.ts";
import { VehicleSystemData } from "@actor/vehicle/data.ts";
import { ItemProxyAvant } from "@item";
import { AbilitySystemData } from "@item/ability/index.ts";
import { CampaignFeatureSystemData } from "@item/campaign-feature/data.ts";
import { FeatSystemData } from "@item/feat/data.ts";
import { HeritageSystemData } from "@item/heritage/data.ts";
import { KitSystemData } from "@item/kit/data.ts";
import { MeleeSystemData } from "@item/melee/data.ts";
import { ActiveEffectAvant } from "@module/active-effect.ts";
import { EnvironmentCanvasGroupAvant } from "@module/canvas/group/environment.ts";
import {
    AmbientLightAvant,
    EffectsCanvasGroupAvant,
    LightingLayerAvant,
    MeasuredTemplateAvant,
    RegionAvant,
    TemplateLayerAvant,
    TokenAvant,
} from "@module/canvas/index.ts";
import { TokenLayerAvant } from "@module/canvas/layer/token.ts";
import { PointVisionSourceAvant } from "@module/canvas/perception/point-vision-source.ts";
import { ChatMessageAvant } from "@module/chat-message/index.ts";
import { ActorsAvant } from "@module/collection/actors.ts";
import { CombatantAvant, EncounterAvant } from "@module/encounter/index.ts";
import { MacroAvant } from "@module/macro.ts";
import { UserAvant } from "@module/user/index.ts";
import {
    AmbientLightDocumentAvant,
    EnvironmentBehaviorType,
    EnvironmentFeatureBehaviorType,
    MeasuredTemplateDocumentAvant,
    RegionBehaviorAvant,
    RegionDocumentAvant,
    SceneAvant,
    TileDocumentAvant,
    TokenDocumentAvant,
} from "@scene/index.ts";
import { ActorDeltaAvant } from "@scene/token-document/actor-delta.ts";
import { monkeyPatchFoundry } from "@scripts/🐵🩹.ts";
import { CheckRoll, StrikeAttackRoll } from "@system/check/roll.ts";
import { ClientDatabaseBackendAvant } from "@system/client-backend.ts";
import { DamageInstance, DamageRoll } from "@system/damage/roll.ts";
import { ArithmeticExpression, Grouping, InstancePool, IntermediateDie } from "@system/damage/terms.ts";
import { HTMLTagifyTagsElement } from "@system/html-elements/tagify-tags.ts";
import * as R from "remeda";

/** Not an actual hook listener but rather things to run on initial load */
export const Load = {
    listen(): void {
        // Assign database backend to handle migrations
        CONFIG.DatabaseBackend = new ClientDatabaseBackendAvant();

        // Assign document classes
        CONFIG.ActiveEffect.documentClass = ActiveEffectAvant;
        CONFIG.Actor.collection = ActorsAvant;
        CONFIG.Actor.documentClass = ActorProxyAvant;
        CONFIG.ActorDelta.documentClass = ActorDeltaAvant;
        CONFIG.AmbientLight.documentClass = AmbientLightDocumentAvant;
        CONFIG.AmbientLight.objectClass = AmbientLightAvant;
        CONFIG.ChatMessage.documentClass = ChatMessageAvant;
        CONFIG.Combat.documentClass = EncounterAvant;
        CONFIG.Combatant.documentClass = CombatantAvant;
        CONFIG.Item.documentClass = ItemProxyAvant;
        CONFIG.Macro.documentClass = MacroAvant;
        CONFIG.MeasuredTemplate.defaults.angle = 90;
        CONFIG.MeasuredTemplate.defaults.width = 1;
        CONFIG.MeasuredTemplate.documentClass = MeasuredTemplateDocumentAvant;
        CONFIG.MeasuredTemplate.objectClass = MeasuredTemplateAvant;
        CONFIG.Region.documentClass = RegionDocumentAvant;
        CONFIG.Region.objectClass = RegionAvant;
        CONFIG.RegionBehavior.dataModels.environment = EnvironmentBehaviorType;
        CONFIG.RegionBehavior.dataModels.environmentFeature = EnvironmentFeatureBehaviorType;
        CONFIG.RegionBehavior.documentClass = RegionBehaviorAvant;
        CONFIG.RegionBehavior.typeIcons.environment = "fa-solid fa-mountain-sun";
        CONFIG.RegionBehavior.typeIcons.environmentFeature = "fa-solid fa-wind";
        CONFIG.RegionBehavior.typeLabels.environment = "AVANT.Region.Environment.Label";
        CONFIG.RegionBehavior.typeLabels.environmentFeature = "AVANT.Region.EnvironmentFeature.Label";
        CONFIG.Scene.documentClass = SceneAvant;
        CONFIG.Tile.documentClass = TileDocumentAvant;
        CONFIG.Token.documentClass = TokenDocumentAvant;
        CONFIG.Token.objectClass = TokenAvant;
        CONFIG.User.documentClass = UserAvant;

        // Actor system data models
        CONFIG.Actor.dataModels.army = ArmySystemData;
        CONFIG.Actor.dataModels.familiar = FamiliarSystemData;
        CONFIG.Actor.dataModels.hazard = HazardSystemData;
        CONFIG.Actor.dataModels.loot = LootSystemData;
        CONFIG.Actor.dataModels.party = PartySystemData;
        CONFIG.Actor.dataModels.vehicle = VehicleSystemData;

        // Item system data models
        CONFIG.Item.dataModels.action = AbilitySystemData;
        CONFIG.Item.dataModels.campaignFeature = CampaignFeatureSystemData;
        CONFIG.Item.dataModels.feat = FeatSystemData;
        CONFIG.Item.dataModels.heritage = HeritageSystemData;
        CONFIG.Item.dataModels.kit = KitSystemData;
        CONFIG.Item.dataModels.melee = MeleeSystemData;

        // Assign canvas layer and placeable classes
        CONFIG.Canvas.darknessColor = 0x2d2d52; // Lightness increased by ~0.4/10 (Munsell value)
        CONFIG.Canvas.exploredColor = 0x262626; // Increased from 0 (black)
        CONFIG.Canvas.groups.effects.groupClass = EffectsCanvasGroupAvant;
        CONFIG.Canvas.groups.environment.groupClass = EnvironmentCanvasGroupAvant;
        CONFIG.Canvas.layers.lighting.layerClass = LightingLayerAvant;
        CONFIG.Canvas.layers.templates.layerClass = TemplateLayerAvant;
        CONFIG.Canvas.layers.tokens.layerClass = TokenLayerAvant;
        CONFIG.Canvas.visionSourceClass = PointVisionSourceAvant;

        CONFIG.Dice.rolls.push(CheckRoll, StrikeAttackRoll, DamageRoll, DamageInstance);
        for (const TermCls of [ArithmeticExpression, Grouping, InstancePool, IntermediateDie]) {
            CONFIG.Dice.termTypes[TermCls.name] = TermCls;
        }

        // Add functions to the `Math` namespace for use in `Roll` formulas
        Math.eq = (a: number, b: number): boolean => a === b;
        Math.gt = (a: number, b: number): boolean => a > b;
        Math.gte = (a: number, b: number): boolean => a >= b;
        Math.lt = (a: number, b: number): boolean => a < b;
        Math.lte = (a: number, b: number): boolean => a <= b;
        Math.ne = (a: number, b: number): boolean => a !== b;
        Math.ternary = (condition: boolean | number, ifTrue: number, ifFalse: number): number =>
            condition ? ifTrue : ifFalse;

        // Mystery Man but with a drop shadow
        Actor.DEFAULT_ICON = "systems/avant/icons/default-icons/mystery-man.svg";

        // Inline link icons
        CONFIG.Actor.typeIcons = {
            familiar: "fa-solid fa-cat",
            hazard: "fa-solid fa-hill-rockslide",
            loot: "fa-solid fa-treasure-chest",
        };
        CONFIG.Item.typeIcons = {
            action: "fa-solid fa-person-running-fast",
            affliction: "fa-solid fa-biohazard",
            ancestry: "fa-solid fa-person-fairy",
            armor: "fa-solid fa-shirt-long-sleeve",
            background: "fa-solid fa-baby",
            backpack: "fa-solid fa-sack",
            book: "fa-solid fa-book",
            class: "fa-solid fa-user-beard-bolt",
            condition: "fa-solid fa-face-zany",
            consumable: "fa-solid fa-flask-round-potion",
            deity: "fa-solid fa-hamsa",
            effect: "fa-solid fa-person-rays",
            equipment: "fa-solid fa-hat-cowboy",
            feat: "fa-solid fa-medal",
            heritage: "fa-solid fa-wreath-laurel",
            shield: "fa-solid fa-shield-halved",
            spell: "fa-solid fa-sparkles",
            treasure: "fa-solid fa-gem",
            weapon: "fa-solid fa-sword",
        };

        // Make available immediately on load for module subclassing
        window.AutomaticBonusProgression = AutomaticBonusProgression;

        // Add custom HTML elements
        window.customElements.define(HTMLTagifyTagsElement.tagName, HTMLTagifyTagsElement);

        // Monkey-patch `TextEditor.enrichHTML`
        monkeyPatchFoundry();

        // Prevent buttons from retaining focus when clicked so that canvas hotkeys still work
        document.addEventListener("mouseup", (): void => {
            const element = document.activeElement;
            if (element instanceof HTMLButtonElement && !element.classList.contains("pm-dropdown")) {
                element.blur();
            }
        });

        function rerenderApps(path: string): void {
            const apps = [...Object.values(ui.windows), ...foundry.applications.instances.values(), ui.sidebar];
            for (const app of apps) {
                if (path.endsWith(".json") && app instanceof ActorSheetAvant) {
                    resetActors([app.actor]);
                } else {
                    app.render();
                }
            }
            if (path.includes("system/effects")) game.avant.effectPanel.render();
        }

        // HMR for template files
        if (import.meta.hot) {
            import.meta.hot.on("lang-update", async ({ path }: { path: string }): Promise<void> => {
                const lang = await fu.fetchJsonWithTimeout(path);
                if (!R.isPlainObject(lang)) {
                    ui.notifications.error(`Failed to load ${path}`);
                    return;
                }
                const apply = (): void => {
                    fu.mergeObject(game.i18n.translations, lang);
                    rerenderApps(path);
                };
                if (game.ready) {
                    apply();
                } else {
                    Hooks.once("ready", apply);
                }
            });

            import.meta.hot.on("template-update", async ({ path }: { path: string }): Promise<void> => {
                const apply = async (): Promise<void> => {
                    delete Handlebars.partials[path];
                    await getTemplate(path);
                    rerenderApps(path);
                };
                if (game.ready) {
                    apply();
                } else {
                    Hooks.once("ready", apply);
                }
            });
        }
    },
};
