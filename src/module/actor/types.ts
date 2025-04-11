import type * as ActorInstance from "@actor";
import type { ActorAvant } from "@actor";
import type { ItemAvant } from "@item";
import type { EffectTrait } from "@item/abstract-effect/types.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import type { ItemInstances } from "@item/types.ts";
import type { RollNoteAvant } from "@module/notes.ts";
import type { ItemAlteration } from "@module/rules/rule-element/item-alteration/alteration.ts";
import type { TokenDocumentAvant } from "@scene";
import type { immunityTypes, resistanceTypes, weaknessTypes } from "@scripts/config/iwr.ts";
import type { DamageRoll } from "@system/damage/roll.ts";
import type { DegreeOfSuccessString } from "@system/degree-of-success.ts";
import type { Predicate } from "@system/predication.ts";
import type {
    ACTOR_TYPES,
    ATTRIBUTE_ABBREVIATIONS,
    CORE_SKILL_SLUGS,
    MOVEMENT_TYPES,
    SAVE_TYPES,
    UNAFFECTED_TYPES,
} from "./values.ts";

type ActorType = (typeof ACTOR_TYPES)[number];

/** Used exclusively to resolve `ActorAvant#isOfType` */
interface ActorInstances<TParent extends TokenDocumentAvant | null> {
    army: ActorInstance.ArmyAvant<TParent>;
    character: ActorInstance.CharacterAvant<TParent>;
    creature: ActorInstance.CreatureAvant<TParent>;
    familiar: ActorInstance.FamiliarAvant<TParent>;
    hazard: ActorInstance.HazardAvant<TParent>;
    loot: ActorInstance.LootAvant<TParent>;
    party: ActorInstance.PartyAvant<TParent>;
    npc: ActorInstance.NPCAvant<TParent>;
    vehicle: ActorInstance.VehicleAvant<TParent>;
}

type EmbeddedItemInstances<TParent extends ActorAvant> = {
    [K in keyof ItemInstances<TParent>]: ItemInstances<TParent>[K][];
};
type AttributeString = SetElement<typeof ATTRIBUTE_ABBREVIATIONS>;

interface ActorDimensions {
    length: number;
    width: number;
    height: number;
}

type SkillSlug = SetElement<typeof CORE_SKILL_SLUGS>;

type ActorAlliance = "party" | "opposition" | null;

type SaveType = (typeof SAVE_TYPES)[number];

type DCSlug = "ac" | "armor" | "perception" | SaveType | SkillSlug;

type MovementType = (typeof MOVEMENT_TYPES)[number];

interface AuraData {
    slug: string;
    level: number | null;
    radius: number;
    traits: EffectTrait[];
    effects: AuraEffectData[];
    appearance: AuraAppearanceData;
}

interface AuraEffectData {
    uuid: string;
    parent: ItemAvant;
    affects: "allies" | "enemies" | "all";
    events: ("enter" | "turn-start" | "turn-end")[];
    save: {
        type: SaveType;
        dc: number;
    } | null;
    predicate: Predicate;
    removeOnExit: boolean;
    includesSelf: boolean;
    alterations: ItemAlteration[];
}

interface AuraAppearanceData {
    border: { color: number; alpha: number } | null;
    highlight: { color: number; alpha: number };
    texture: {
        src: ImageFilePath | VideoFilePath;
        alpha: number;
        scale: number;
        translation: { x: number; y: number } | null;
        loop: boolean;
        playbackRate: number;
    } | null;
}

interface ActorCommitData<T extends ActorAvant = ActorAvant> {
    actorUpdates: DeepPartial<T["_source"]> | null;
    itemCreates: PreCreate<ItemSourceAvant>[];
    itemUpdates: EmbeddedDocumentUpdateData[];
}

interface ActorRechargeData<T extends ActorAvant> extends ActorCommitData<T> {
    affected: {
        frequencies: boolean;
        spellSlots: boolean;
        resources: string[];
    };
}

/* -------------------------------------------- */
/*  Attack Rolls                                */
/* -------------------------------------------- */

interface ApplyDamageParams {
    damage: number | Rolled<DamageRoll>;
    token: TokenDocumentAvant;
    /** The item used in the damaging action */
    item?: ItemAvant<ActorAvant> | null;
    skipIWR?: boolean;
    /** Predicate statements from the damage roll */
    rollOptions?: Set<string>;
    shieldBlockRequest?: boolean;
    breakdown?: string[];
    outcome?: DegreeOfSuccessString | null;
    notes?: RollNoteAvant[];
    /** Whether to treat to not adjust the damage any further. Skips IWR regardless of its setting if set */
    final?: boolean;
}

type ImmunityType = keyof typeof immunityTypes;
type WeaknessType = keyof typeof weaknessTypes;
type ResistanceType = keyof typeof resistanceTypes;
/** Damage types a creature or hazard is possibly unaffected by, outside the IWR framework */
type UnaffectedType = SetElement<typeof UNAFFECTED_TYPES>;
type IWRType = ImmunityType | WeaknessType | ResistanceType;

export type {
    ActorAlliance,
    ActorCommitData,
    ActorDimensions,
    ActorInstances,
    ActorRechargeData,
    ActorType,
    ApplyDamageParams,
    AttributeString,
    AuraAppearanceData,
    AuraData,
    AuraEffectData,
    DCSlug,
    EmbeddedItemInstances,
    ImmunityType,
    IWRType,
    MovementType,
    ResistanceType,
    SaveType,
    SkillSlug,
    UnaffectedType,
    WeaknessType,
};
