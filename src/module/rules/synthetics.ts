import type { ActorAvant } from "@actor";
import type { DexterityModifierCapData } from "@actor/character/types.ts";
import type { LabeledSpeed, SenseData } from "@actor/creature/data.ts";
import type {
    DamageDiceAvant,
    DeferredDamageDiceOptions,
    DeferredPromise,
    DeferredValue,
    ModifierAdjustment,
    ModifierAvant,
} from "@actor/modifiers.ts";
import type { MovementType } from "@actor/types.ts";
import type { MeleeAvant, WeaponAvant } from "@item";
import type { AbilityTrait } from "@item/ability/index.ts";
import type { ConditionSource, EffectSource } from "@item/base/data/index.ts";
import type { WeaponRuneSource } from "@item/weapon/data.ts";
import type { WeaponPropertyRuneType } from "@item/weapon/types.ts";
import type { ActiveEffectAvant } from "@module/active-effect.ts";
import type { RollNoteAvant } from "@module/notes.ts";
import type { MaterialDamageEffect } from "@system/damage/types.ts";
import type { DegreeOfSuccessAdjustment } from "@system/degree-of-success.ts";
import type { Predicate } from "@system/predication.ts";
import type { Statistic } from "@system/statistic/index.ts";
import type { TokenSource } from "types/foundry/common/documents/token.d.ts";
import type { DamageAlteration } from "./rule-element/damage-alteration/alteration.ts";
import { ItemAlterationRuleElement } from "./rule-element/item-alteration/rule-element.ts";
import type { Suboption } from "./rule-element/roll-option/data.ts";
import { SpecialResourceRuleElement } from "./rule-element/special-resource.ts";

/** Defines a list of data provided by rule elements that an actor can pull from during its data preparation lifecycle */
interface RuleElementSynthetics<TActor extends ActorAvant = ActorAvant> {
    criticalSpecializations: {
        standard: CritSpecSynthetic[];
        alternate: CritSpecSynthetic[];
    };
    damageAlterations: Record<string, DamageAlteration[]>;
    damageDice: DamageDiceSynthetics;
    degreeOfSuccessAdjustments: Record<string, DegreeOfSuccessAdjustment[]>;
    dexterityModifierCaps: DexterityModifierCapData[];
    itemAlterations: ItemAlterationRuleElement[];
    ephemeralEffects: Record<
        string,
        { target: DeferredEphemeralEffect[]; origin: DeferredEphemeralEffect[] } | undefined
    >;
    modifierAdjustments: ModifierAdjustmentSynthetics;
    modifiers: ModifierSynthetics;
    movementTypes: { [K in MovementType]?: DeferredMovementType[] };
    multipleAttackPenalties: Record<string, MAPSynthetic[]>;
    resources: Record<string, SpecialResourceRuleElement>;
    rollNotes: Record<string, RollNoteAvant[]>;
    rollSubstitutions: Record<string, RollSubstitution[]>;
    rollTwice: Record<string, RollTwiceSynthetic[]>;
    senses: SenseSynthetic[];
    statistics: Map<string, Statistic>;
    strikeAdjustments: StrikeAdjustment[];
    strikes: Record<string, DeferredStrike>;
    striking: Record<string, StrikingSynthetic[]>;
    toggles: Record<string, Record<string, RollOptionToggle>>;
    tokenEffectIcons: ActiveEffectAvant<TActor>[];
    tokenMarks: Map<TokenDocumentUUID, string>;
    tokenOverrides: DeepPartial<Pick<TokenSource, "light" | "name">> & {
        alpha?: number | null;
        texture?:
            | { src: ImageFilePath | VideoFilePath; tint?: Color | null }
            | { src: ImageFilePath | VideoFilePath; tint?: Color | null; scaleX: number; scaleY: number };
        ring?: {
            subject: TokenDocument["ring"]["subject"];
            colors: TokenDocument["ring"]["colors"];
            effects: TokenDocument["ring"]["effects"];
        };
        animation?: TokenAnimationOptions;
    };
    weaponPotency: Record<string, PotencySynthetic[]>;
}

type CritSpecEffect = (DamageDiceAvant | ModifierAvant | RollNoteAvant)[];
type CritSpecSynthetic = (weapon: WeaponAvant | MeleeAvant, options: Set<string>) => CritSpecEffect | null;

type DamageDiceSynthetics = { damage: DeferredDamageDice[] } & Record<string, DeferredDamageDice[] | undefined>;
type ModifierSynthetics = Record<"all" | "damage", DeferredModifier[]> & Record<string, DeferredModifier[] | undefined>;
type ModifierAdjustmentSynthetics = { all: ModifierAdjustment[]; damage: ModifierAdjustment[] } & Record<
    string,
    ModifierAdjustment[] | undefined
>;
type DeferredModifier = DeferredValue<ModifierAvant>;
type DeferredDamageDice = (args: DeferredDamageDiceOptions) => DamageDiceAvant | null;
type DeferredMovementType = DeferredValue<BaseSpeedSynthetic | null>;
type DeferredEphemeralEffect = DeferredPromise<EffectSource | ConditionSource | null>;
type DeferredStrike = (runes?: WeaponRuneSource) => WeaponAvant<ActorAvant> | null;

interface BaseSpeedSynthetic extends Omit<LabeledSpeed, "label" | "type"> {
    type: MovementType;
    /**
     * Whether this speed is derived from a creature's land speed:
     * used as a cue to prevent double-application of modifiers
     */
    derivedFromLand: boolean;
}

interface MAPSynthetic {
    label: string;
    penalty: number;
    predicate: Predicate;
}

interface RollSubstitution {
    slug: string;
    label: string;
    predicate: Predicate;
    value: number;
    required: boolean;
    selected: boolean;
    effectType: "fortune" | "misfortune";
}

interface RollOptionToggle {
    /** The ID of the item with a rule element for this toggle */
    itemId: string;
    label: string;
    placement: string;
    domain: string;
    option: string;
    suboptions: Suboption[];
    alwaysActive: boolean;
    checked: boolean;
    enabled: boolean;
}

interface RollTwiceSynthetic {
    keep: "higher" | "lower";
    predicate: Predicate;
}

interface SenseSynthetic {
    sense: Required<SenseData>;
    predicate: Predicate;
    force: boolean;
}

interface StrikeAdjustment {
    adjustDamageRoll?: (
        weapon: WeaponAvant | MeleeAvant,
        { materials }: { materials?: Set<MaterialDamageEffect> },
    ) => void;
    adjustWeapon?: (weapon: WeaponAvant | MeleeAvant) => void;
    adjustTraits?: (weapon: WeaponAvant | MeleeAvant, traits: AbilityTrait[]) => void;
}

interface StrikingSynthetic {
    label: string;
    bonus: number;
    predicate: Predicate;
}

interface PotencySynthetic {
    label: string;
    bonus: number;
    type: "item" | "potency";
    predicate: Predicate;
    property?: WeaponPropertyRuneType[];
}

export type {
    BaseSpeedSynthetic,
    CritSpecEffect,
    DamageDiceSynthetics,
    DeferredDamageDice,
    DeferredEphemeralEffect,
    DeferredModifier,
    DeferredMovementType,
    MAPSynthetic,
    ModifierAdjustmentSynthetics,
    ModifierSynthetics,
    PotencySynthetic,
    RollOptionToggle,
    RollSubstitution,
    RollTwiceSynthetic,
    RuleElementSynthetics,
    SenseSynthetic,
    StrikeAdjustment,
    StrikingSynthetic,
};
