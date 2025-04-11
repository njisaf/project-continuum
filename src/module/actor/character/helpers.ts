import type { ActorAvant, CharacterAvant } from "@actor";
import { AttackTraitHelpers } from "@actor/creature/helpers.ts";
import { ModifierAvant } from "@actor/modifiers.ts";
import type { AbilityItemAvant, ArmorAvant, ConditionAvant, WeaponAvant } from "@item";
import { EffectAvant, ItemProxyAvant } from "@item";
import { ItemCarryType } from "@item/physical/index.ts";
import { ChatMessageAvant } from "@module/chat-message/document.ts";
import { ZeroToThree, ZeroToTwo } from "@module/data.ts";
import { extractModifierAdjustments } from "@module/rules/helpers.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { SheetOptions, createSheetOptions } from "@module/sheet/helpers.ts";
import { DAMAGE_DIE_SIZES } from "@system/damage/values.ts";
import { Predicate } from "@system/predication.ts";
import { ErrorAvant, getActionGlyph, objectHasKey, sluggify, tupleHasValue } from "@util";
import { traitSlugToObject } from "@util/tags.ts";
import * as R from "remeda";

/** Handle weapon traits that introduce modifiers or add other weapon traits */
class PCAttackTraitHelpers extends AttackTraitHelpers {
    static adjustWeapon(weapon: WeaponAvant): void {
        const traits = weapon.system.traits.value;
        for (const trait of [...traits]) {
            switch (trait.replace(/-d?\d{1,3}$/, "")) {
                case "fatal-aim": {
                    if (weapon.range?.increment && weapon.handsHeld === 2) {
                        const fatal = trait.replace("-aim", "");
                        if (objectHasKey(CONFIG.AVANT.weaponTraits, fatal) && !traits.includes(fatal)) {
                            traits.push(fatal);
                        }
                    }
                    break;
                }
                case "jousting": {
                    if (weapon.handsHeld === 1) {
                        const die = /(d\d{1,2})$/.exec(trait)?.[1];
                        if (tupleHasValue(DAMAGE_DIE_SIZES, die)) {
                            weapon.system.damage.die = die;
                        }
                    }
                    break;
                }
                default:
                    break;
            }
        }
    }

    static override createAttackModifiers({ item, domains }: CreateAttackModifiersParams): ModifierAvant[] {
        const { actor } = item;
        if (!actor) throw ErrorAvant("The weapon must be embedded");

        const traitsAndTags = [item.system.traits.value, item.system.traits.otherTags].flat().filter(R.isTruthy);
        const synthetics = actor.synthetics.modifierAdjustments;

        const pcSpecificModifiers = traitsAndTags.flatMap((trait) => {
            const unannotatedTrait = this.getUnannotatedTrait(trait);
            switch (unannotatedTrait) {
                case "kickback": {
                    // (pre-remaster language)
                    // "Firing a kickback weapon gives a –2 circumstance penalty to the attack roll, but characters with
                    // 14 or more Strength ignore the penalty."
                    return new ModifierAvant({
                        slug: unannotatedTrait,
                        label: CONFIG.AVANT.weaponTraits.kickback,
                        modifier: -2,
                        type: "circumstance",
                        predicate: new Predicate({ lt: ["attribute:str:mod", 2] }),
                        adjustments: extractModifierAdjustments(synthetics, domains, unannotatedTrait),
                    });
                }
                case "improvised": {
                    return new ModifierAvant({
                        slug: unannotatedTrait,
                        label: this.getLabel(trait),
                        modifier: -2,
                        type: "item",
                        predicate: new Predicate({ not: "self:ignore-improvised-penalty" }),
                        adjustments: extractModifierAdjustments(synthetics, domains, unannotatedTrait),
                    });
                }
                default:
                    return [];
            }
        });

        return [...super.createAttackModifiers({ item, domains }), ...pcSpecificModifiers];
    }
}

interface AuxiliaryInteractParams {
    weapon: WeaponAvant<CharacterAvant>;
    action: "interact";
    annotation: "draw" | "grip" | "modular" | "pick-up" | "retrieve" | "sheathe";
    hands?: ZeroToTwo;
}

interface AuxiliaryWeaponParryParams {
    weapon: WeaponAvant<CharacterAvant>;
    action: "parry";
    annotation?: never;
    hands?: never;
}

interface AuxiliaryShieldParams {
    weapon: WeaponAvant<CharacterAvant>;
    action: "end-cover" | "raise-a-shield" | "take-cover";
    annotation?: "tower-shield";
    hands?: never;
}

interface AuxiliaryReleaseParams {
    weapon: WeaponAvant<CharacterAvant>;
    action: "release";
    annotation: "grip" | "drop";
    hands: 0 | 1;
}

type AuxiliaryActionParams =
    | AuxiliaryInteractParams
    | AuxiliaryWeaponParryParams
    | AuxiliaryShieldParams
    | AuxiliaryReleaseParams;
type AuxiliaryActionType = AuxiliaryActionParams["action"];
type AuxiliaryActionPurpose = AuxiliaryActionParams["annotation"];

/** Create an "auxiliary" action, an Interact or Release action using a weapon */
class WeaponAuxiliaryAction {
    readonly weapon: WeaponAvant<CharacterAvant>;
    readonly action: AuxiliaryActionType;
    readonly actions: ZeroToThree;
    readonly carryType: ItemCarryType | null;
    readonly hands: ZeroToTwo | null;
    readonly annotation: NonNullable<AuxiliaryActionPurpose> | null;
    /** A "full purpose" reflects the options to draw, sheathe, etc. a weapon */
    readonly fullAnnotation: string | null;

    constructor({ weapon, action, annotation, hands }: AuxiliaryActionParams) {
        this.weapon = weapon;
        this.action = action;
        this.annotation = annotation ?? null;
        this.hands = hands ?? null;

        type ActionCostCarryTypePurpose = [ZeroToThree, ItemCarryType | null, string | null];
        const [actions, carryType, fullPurpose] = ((): ActionCostCarryTypePurpose => {
            switch (annotation) {
                case "draw":
                    return [1, "held", `${annotation}${hands}H`];
                case "pick-up":
                    return [1, "held", `${annotation}${hands}H`];
                case "retrieve": {
                    const { container } = weapon;
                    if (container?.isHeld) return [1, "held", `${annotation}${hands}H`];
                    const usage = container?.system.usage;
                    const actionCost = usage?.type === "held" || usage?.where === "backpack" ? 2 : 1;
                    return [actionCost, "held", `${annotation}${hands}H`];
                }
                case "grip":
                    return [action === "interact" ? 1 : 0, "held", annotation];
                case "sheathe":
                    return [1, "worn", annotation];
                case "modular":
                    return [1, null, annotation];
                case "drop":
                    return [0, "dropped", annotation];
                case "tower-shield": {
                    const cost = this.action === "take-cover" ? 1 : 0;
                    return [cost, null, null];
                }
                default:
                    return [1, null, null];
            }
        })();

        this.actions = actions;
        this.carryType = carryType;
        this.fullAnnotation = fullPurpose;
    }

    get actor(): CharacterAvant {
        return this.weapon.parent;
    }

    get label(): string {
        const actionKey = sluggify(this.action, { camel: "bactrian" });
        const purposeKey = this.fullAnnotation ? sluggify(this.fullAnnotation, { camel: "bactrian" }) : null;
        return purposeKey
            ? game.i18n.localize(`AVANT.Actions.${actionKey}.${purposeKey}.Title`)
            : game.i18n.localize(`AVANT.Actions.${actionKey}.ShortTitle`);
    }

    get glyph(): string {
        return getActionGlyph(this.actions);
    }

    get options(): SheetOptions | null {
        if (this.annotation === "modular") {
            const toggles = this.weapon.system.traits.toggles;
            return createSheetOptions(
                R.pick(CONFIG.AVANT.damageTypes, toggles.modular.options),
                [toggles.modular.selected ?? []].flat(),
            );
        }
        return null;
    }

    /**
     * Execute an auxiliary action.
     * [options.selection] A choice of some kind: currently only has meaning for modular trait toggling
     */
    async execute({ selection = null }: { selection?: string | null } = {}): Promise<void> {
        const { actor, weapon } = this;
        const COVER_UUID = "Compendium.avant.other-effects.Item.I9lfZUiCwMiGogVi";

        if (this.carryType) {
            await actor.changeCarryType(this.weapon, { carryType: this.carryType, handsHeld: this.hands ?? 0 });
        } else if (selection && tupleHasValue(weapon.system.traits.toggles.modular.options, selection)) {
            const updated = await weapon.system.traits.toggles.update({ trait: "modular", selected: selection });
            if (!updated) return;
        } else if (this.action === "raise-a-shield") {
            // Apply Effect: Raise a Shield
            const alreadyRaised = actor.itemTypes.effect.some((e) => e.slug === "raise-a-shield");
            if (alreadyRaised) return;
            const effect = await fromUuid("Compendium.avant.equipment-effects.Item.2YgXoHvJfrDHucMr");
            if (effect instanceof EffectAvant) {
                await actor.createEmbeddedDocuments("Item", [{ ...effect.toObject(), _id: null }]);
            }
        } else if (this.action === "take-cover") {
            // Apply Effect: Cover with a greater-cover selection
            const effect = await fromUuid(COVER_UUID);
            if (effect instanceof EffectAvant) {
                const data = { ...effect.toObject(), _id: null };
                data.system.traits.otherTags.push("tower-shield");
                type ChoiceSetSource = RuleElementSource & { selection?: unknown };
                const rule = data.system.rules.find((r): r is ChoiceSetSource => r.key === "ChoiceSet");
                if (rule) rule.selection = { bonus: 4, level: "greater" };
                await actor.createEmbeddedDocuments("Item", [data]);
            }
        } else if (this.action === "end-cover") {
            await actor.itemTypes.effect.find((e) => e.sourceId === COVER_UUID)?.delete();
        } else if (this.action === "parry") {
            // Apply Effect: Parry
            const alreadyParrying = actor.itemTypes.effect.some((e) => e.slug === "parry");
            if (alreadyParrying) return;
            const effect = await fromUuid("Compendium.avant.equipment-effects.Item.fRlvmul3LbLo2xvR");
            if (effect instanceof EffectAvant) {
                await actor.createEmbeddedDocuments("Item", [{ ...effect.toObject(), _id: null }]);
            }
        }

        if (!game.combat) return; // Only send out messages if in encounter mode

        const templates = {
            flavor: "./systems/avant/templates/chat/action/flavor.hbs",
            content: "./systems/avant/templates/chat/action/content.hbs",
        };

        const actionKey = sluggify(this.action, { camel: "bactrian" });
        const annotationKey = this.annotation ? sluggify(this.annotation, { camel: "bactrian" }) : null;
        const fullAnnotationKey = this.fullAnnotation ? sluggify(this.fullAnnotation, { camel: "bactrian" }) : null;
        const flavorAction = {
            title: `AVANT.Actions.${actionKey}.Title`,
            subtitle: fullAnnotationKey ? `AVANT.Actions.${actionKey}.${fullAnnotationKey}.Title` : null,
            glyph: this.glyph,
        };

        const [traits, message] = ["raise-a-shield", "parry"].includes(this.action)
            ? [[], `AVANT.Actions.${actionKey}.Content`]
            : ["take-cover", "end-cover"].includes(this.action)
              ? [[], `AVANT.Actions.${actionKey}.${annotationKey}.Description`]
              : [
                    [traitSlugToObject("manipulate", CONFIG.AVANT.actionTraits)],
                    `AVANT.Actions.${actionKey}.${fullAnnotationKey}.Description`,
                ];

        const flavor = await renderTemplate(templates.flavor, { action: flavorAction, traits });

        const content = await renderTemplate(templates.content, {
            imgPath: weapon.img,
            message: game.i18n.format(message, {
                actor: actor.name,
                weapon: weapon.name,
                shield: weapon.shield?.name ?? weapon.name,
                damageType: game.i18n.localize(`AVANT.Damage.RollFlavor.${selection}`),
            }),
        });

        const token = actor.getActiveTokens(false, true).shift();

        await ChatMessageAvant.create({
            content,
            speaker: ChatMessageAvant.getSpeaker({ actor, token }),
            flavor,
            style: CONST.CHAT_MESSAGE_STYLES.EMOTE,
        });
    }
}

/** Make a PC Clumsy 1 when wielding an oversized weapon */
function imposeOversizedWeaponCondition(actor: CharacterAvant): void {
    if (actor.conditions.clumsy) return;

    const wieldedOversizedWeapon = actor.itemTypes.weapon.find(
        (w) => w.isEquipped && w.isOversized && w.category !== "unarmed",
    );
    const compendiumCondition = game.avant.ConditionManager.getCondition("clumsy");
    const conditionSource =
        wieldedOversizedWeapon && actor.conditions.bySlug("clumsy").length === 0
            ? fu.mergeObject(compendiumCondition.toObject(), {
                  _id: "AvantOversized001",
                  system: { slug: "clumsy", references: { parent: { id: wieldedOversizedWeapon.id } } },
              })
            : null;
    if (!conditionSource) return;

    const clumsyOne = new ItemProxyAvant(conditionSource, { parent: actor }) as ConditionAvant<CharacterAvant>;
    clumsyOne.prepareSiblingData();
    clumsyOne.prepareActorData();
    for (const rule of clumsyOne.prepareRuleElements()) {
        rule.beforePrepareData?.();
    }
    actor.conditions.set(clumsyOne.id, clumsyOne);
}

interface CreateAttackModifiersParams {
    item: AbilityItemAvant<CharacterAvant> | WeaponAvant<CharacterAvant>;
    domains: string[];
}

/** Create a penalty for attempting to Force Open without a crowbar or equivalent tool */
function createForceOpenPenalty(actor: CharacterAvant, domains: string[]): ModifierAvant {
    const slug = "no-crowbar";
    const { modifierAdjustments } = actor.synthetics;
    return new ModifierAvant({
        slug,
        label: "AVANT.Actions.ForceOpen.NoCrowbarPenalty",
        type: "item",
        modifier: -2,
        predicate: ["action:force-open", "action:force-open:prying"],
        hideIfDisabled: true,
        adjustments: extractModifierAdjustments(modifierAdjustments, domains, slug),
    });
}

function createShoddyPenalty(
    actor: ActorAvant,
    item: WeaponAvant | ArmorAvant | null,
    domains: string[],
): ModifierAvant | null {
    if (!actor.isOfType("character") || !item?.isShoddy) return null;

    const slug = "shoddy";

    return new ModifierAvant({
        label: "AVANT.Item.Physical.OtherTag.Shoddy",
        type: "item",
        slug,
        modifier: -2,
        adjustments: extractModifierAdjustments(actor.synthetics.modifierAdjustments, domains, slug),
    });
}

/**
 * Create a penalty for wearing armor with the "ponderous" trait
 * "You take a –5 penalty to all your Speeds (to a minimum of a 5-foot Speed). This is separate from and in addition to
 * the armor's Speed penalty, and affects you even if your Strength or an ability lets you reduce or ignore the armor's
 * Speed penalty."
 */
function createHinderingPenalty(actor: CharacterAvant): ModifierAvant | null {
    const slug = "hindering";
    return actor.wornArmor?.traits.has(slug)
        ? new ModifierAvant({
              label: "AVANT.TraitHindering",
              type: "untyped",
              slug,
              modifier: -5,
              adjustments: [],
          })
        : null;
}

/**
 * Create a penalty for wearing armor with the "ponderous" trait
 * "While wearing the armor, you take a –1 penalty to initiative checks. If you don't meet the armor's required Strength
 * score, this penalty increases to be equal to the armor's check penalty if it's worse."
 */
function createPonderousPenalty(actor: CharacterAvant): ModifierAvant | null {
    const armor = actor.wornArmor;
    const slug = "ponderous";
    if (!armor?.traits.has(slug)) return null;

    const penaltyValue = actor.abilities.str.mod >= (armor.strength ?? -Infinity) ? -1 : armor.checkPenalty || -1;

    return new ModifierAvant({
        label: "AVANT.TraitPonderous",
        type: "untyped",
        slug,
        modifier: penaltyValue,
        adjustments: extractModifierAdjustments(actor.synthetics.modifierAdjustments, ["all", "initiative"], slug),
    });
}

export {
    PCAttackTraitHelpers,
    WeaponAuxiliaryAction,
    createForceOpenPenalty,
    createHinderingPenalty,
    createPonderousPenalty,
    createShoddyPenalty,
    imposeOversizedWeaponCondition,
};
