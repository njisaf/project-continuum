import type { ActorAvant, ActorUpdateOperation } from "@actor/base.ts";
import type { CREATURE_ACTOR_TYPES } from "@actor/values.ts";
import type { AbilityItemAvant, MeleeAvant, WeaponAvant } from "@item";
import { LabeledValueAndMax } from "@module/data.ts";
import type { TokenDocumentAvant } from "@scene/index.ts";
import type { LANGUAGES_BY_RARITY, SENSE_TYPES } from "./values.ts";

/** A `CreatureAvant` subtype string */
type CreatureActorType = (typeof CREATURE_ACTOR_TYPES)[number];

type CreatureTrait = keyof typeof CONFIG.AVANT.creatureTraits;

/** One of the major creature types given in the Pathfinder bestiaries */
type CreatureType = keyof typeof CONFIG.AVANT.creatureTypes;

type Language =
    | "common"
    | (typeof LANGUAGES_BY_RARITY.common)[number]
    | (typeof LANGUAGES_BY_RARITY.uncommon)[number]
    | (typeof LANGUAGES_BY_RARITY.rare)[number]
    | (typeof LANGUAGES_BY_RARITY.secret)[number];
type Attitude = keyof typeof CONFIG.AVANT.attitude;

type ModeOfBeing = "living" | "undead" | "construct" | "object";

type SenseAcuity = "precise" | "imprecise" | "vague";
type SenseType = SetElement<typeof SENSE_TYPES>;
type SpecialVisionType = Extract<
    SenseType,
    "low-light-vision" | "darkvision" | "greater-darkvision" | "see-invisibility"
>;

interface GetReachParameters {
    action?: "interact" | "attack";
    weapon?: Maybe<AbilityItemAvant<ActorAvant> | WeaponAvant<ActorAvant> | MeleeAvant<ActorAvant>>;
}

interface CreatureUpdateOperation<TParent extends TokenDocumentAvant | null> extends ActorUpdateOperation<TParent> {
    allowHPOverage?: boolean;
}

interface ResourceData extends LabeledValueAndMax {
    slug: string;
}

export type {
    Attitude,
    CreatureActorType,
    CreatureTrait,
    CreatureType,
    CreatureUpdateOperation,
    GetReachParameters,
    Language,
    ModeOfBeing,
    ResourceData,
    SenseAcuity,
    SenseType,
    SpecialVisionType,
};
