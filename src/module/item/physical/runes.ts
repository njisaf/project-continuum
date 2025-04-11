import { AutomaticBonusProgression as ABP } from "@actor/character/automatic-bonus-progression.ts";
import type { CreatureTrait } from "@actor/creature/index.ts";
import {
    DamageDiceAvant,
    DamageDiceParameters,
    ModifierAdjustment,
    ModifierObjectParams,
    ModifierAvant,
} from "@actor/modifiers.ts";
import { ResistanceType } from "@actor/types.ts";
import type { ArmorAvant, MeleeAvant, PhysicalItemAvant, WeaponAvant } from "@item";
import { AbilityTrait } from "@item/ability/types.ts";
import { ArmorPropertyRuneType, ResilientRuneType } from "@item/armor/types.ts";
import { SpellTrait } from "@item/spell/types.ts";
import { StrikingRuneType, WeaponPropertyRuneType, WeaponRangeIncrement } from "@item/weapon/types.ts";
import { OneToFour, Rarity, ZeroToFour, ZeroToSix } from "@module/data.ts";
import { RollNoteSource } from "@module/notes.ts";
import { StrikeAdjustment } from "@module/rules/synthetics.ts";
import { DegreeOfSuccessAdjustment } from "@system/degree-of-success.ts";
import { Predicate } from "@system/predication.ts";
import { sluggify } from "@util";
import * as R from "remeda";

function getPropertyRuneSlots(item: WeaponAvant | ArmorAvant): ZeroToFour {
    const fromMaterial = item.system.material.type === "orichalcum" ? 1 : 0;
    const getABPPotency = item.isOfType("weapon") ? ABP.getAttackPotency : ABP.getDefensePotency;

    const fromPotency = ABP.isEnabled(item.actor)
        ? // If the item is unowned or on a loot actor, place no limit on slots
          getABPPotency(!item.actor || item.actor.isOfType("loot") ? 20 : item.actor.level)
        : item.system.runes.potency;
    return (fromMaterial + fromPotency) as ZeroToFour;
}

/** Remove duplicate and lesser versions from an array of property runes */
function prunePropertyRunes<T extends string>(runes: (string | null)[], validTypes: Record<T, unknown>): T[];
function prunePropertyRunes(runes: (string | null)[], validTypes: Record<string, unknown>): string[] {
    const runeSet = new Set(runes);
    return Array.from(runeSet).filter(
        (r): r is string =>
            !!r &&
            r in validTypes &&
            !runeSet.has(`greater${r.titleCase()}`) &&
            !runeSet.has(`major${r.replace(/^greater/, "").titleCase()}`) &&
            !runeSet.has(`true${r.replace(/^greater|^major/, "").titleCase()}`),
    );
}

function getRuneValuationData(item: PhysicalItemAvant): RuneData[] {
    if (!item.isOfType("armor", "shield", "weapon")) {
        return [];
    }

    type ItemRuneData = {
        ""?: number;
        potency?: ZeroToFour;
        resilient?: ZeroToFour;
        reinforcing?: ZeroToSix;
        striking?: ZeroToFour;
        property?: string[];
    };
    const itemRunes: ItemRuneData = item.system.runes;

    type WorkingData = {
        runes: Record<string, Record<number | string, RuneData | null>>;
        weaponRunes: Record<string, Record<number | string, RuneData | null>>;
        secondaryFundamental: "resilient" | "striking" | "";
    };
    const data: WorkingData = item.isOfType("armor")
        ? { runes: RUNE_DATA.armor, weaponRunes: {}, secondaryFundamental: "resilient" }
        : item.isOfType("shield")
          ? { runes: RUNE_DATA.shield, weaponRunes: RUNE_DATA.weapon, secondaryFundamental: "" }
          : { runes: RUNE_DATA.weapon, weaponRunes: {}, secondaryFundamental: "striking" };

    return (
        item.isOfType("shield")
            ? [
                  data.runes.reinforcing[item.system.runes.reinforcing],
                  data.weaponRunes.potency[item.system.traits.integrated?.runes.potency ?? 0],
                  data.weaponRunes.striking[item.system.traits.integrated?.runes.striking ?? 0],
                  item.system.traits.integrated?.runes.property.map((p) => data.weaponRunes.property[p]) ?? [],
              ].flat()
            : [
                  data.runes.potency[item.system.runes.potency],
                  data.runes[data.secondaryFundamental]?.[itemRunes[data.secondaryFundamental] ?? ""],
                  item.system.runes.property.map((p) => data.runes.property[p]),
              ].flat()
    ).filter(R.isTruthy);
}

function getPropertyRuneDegreeAdjustments(item: WeaponAvant): DegreeOfSuccessAdjustment[] {
    return R.unique(
        [
            item.system.runes.property.map((p) => WEAPON_PROPERTY_RUNES[p].attack?.dosAdjustments),
            item.system.runes.effects.map((p) => WEAPON_PROPERTY_RUNES[p].attack?.dosAdjustments),
        ].flat(2),
    ).filter(R.isTruthy);
}

function getPropertyRuneDamage(
    weapon: WeaponAvant | MeleeAvant,
    runes: WeaponPropertyRuneType[],
    options: Set<string>,
): (DamageDiceAvant | ModifierAvant)[] {
    return runes.flatMap((rune) => {
        const runeData = WEAPON_PROPERTY_RUNES[rune];
        return fu.deepClone(runeData.damage?.additional ?? []).map((data) => {
            const slug = sluggify(rune);
            if ("modifier" in data) {
                const resolvables = weapon.getRollData();
                const value =
                    typeof data.modifier === "string"
                        ? Number(Roll.replaceFormulaData(data.modifier, resolvables)) || 0
                        : data.modifier;
                return new ModifierAvant({ ...data, slug, modifier: value });
            } else {
                const dice = new DamageDiceAvant({
                    selector: "strike-damage",
                    slug,
                    label: RUNE_DATA.weapon.property[rune]?.name,
                    diceNumber: data.diceNumber ?? 1,
                    dieSize: data.dieSize ?? "d6",
                    damageType: data.damageType,
                    category: data.category ?? null,
                    predicate: data.predicate,
                    critical: data.critical ?? null,
                });
                dice.test(options);
                return dice;
            }
        });
    });
}

function getPropertyRuneStrikeAdjustments(runes: WeaponPropertyRuneType[]): StrikeAdjustment[] {
    return runes.flatMap((r) => RUNE_DATA.weapon.property[r].strikeAdjustments ?? []);
}

function getPropertyRuneModifierAdjustments(runes: WeaponPropertyRuneType[]): ModifierAdjustment[] {
    return runes.flatMap((r) => RUNE_DATA.weapon.property[r].damage?.adjustments ?? []);
}

type RuneDiceProperty = "slug" | "damageType" | "category" | "predicate" | "critical";
type RuneAdditionalDamageDice = Partial<Pick<DamageDiceParameters, RuneDiceProperty>> &
    Required<Pick<DamageDiceParameters, "diceNumber" | "dieSize">>;
type RuneAdditionalDamageModifier = Omit<ModifierObjectParams, "modifier"> & { modifier: string | number };
type RuneAdditionalDamage = RuneAdditionalDamageDice | RuneAdditionalDamageModifier;
type RuneTrait = SpellTrait | CreatureTrait | "saggorak";

/* -------------------------------------------- */
/*  Rune Valuation                              */
/* -------------------------------------------- */

interface RuneData {
    name: string;
    level: number;
    price: number; // in gp
    rarity: Rarity;
    traits: RuneTrait[];
}

interface PotencyRuneData extends RuneData {
    value: OneToFour;
}

interface SecondaryFundamentalRuneData<TSlug extends string> extends RuneData {
    slug: TSlug;
}

interface ReinforcingRuneData extends RuneData {
    hardness: { increase: number; max: number };
    maxHP: { increase: number; max: number };
}

interface FundamentalArmorRuneData {
    potency: Record<ZeroToFour, PotencyRuneData | null>;
    resilient: Record<ZeroToFour, SecondaryFundamentalRuneData<ResilientRuneType> | null>;
}

const FUNDAMENTAL_ARMOR_RUNE_DATA: FundamentalArmorRuneData = {
    // https://2e.aonprd.com/Equipment.aspx?Category=23&Subcategory=24
    potency: {
        0: null,
        1: {
            name: "AVANT.ArmorPotencyRune1",
            value: 1,
            level: 5,
            price: 160,
            rarity: "common",
            traits: [],
        },
        2: {
            name: "AVANT.ArmorPotencyRune2",
            value: 2,
            level: 11,
            price: 1060,
            rarity: "common",
            traits: [],
        },
        3: {
            name: "AVANT.ArmorPotencyRune3",
            value: 3,
            level: 18,
            price: 20_560,
            rarity: "common",
            traits: [],
        },
        4: {
            name: "AVANT.ArmorPotencyRune4",
            value: 4,
            level: 20,
            price: 70_000,
            rarity: "rare",
            traits: ["mythic"],
        },
    },
    resilient: {
        0: null,
        1: {
            name: "AVANT.ArmorResilientRune",
            level: 8,
            price: 340,
            rarity: "common",
            slug: "resilient",
            traits: [],
        },
        2: {
            name: "AVANT.ArmorGreaterResilientRune",
            level: 14,
            price: 3440,
            rarity: "common",
            slug: "greaterResilient",
            traits: [],
        },
        3: {
            name: "AVANT.ArmorMajorResilientRune",
            level: 20,
            price: 49_440,
            rarity: "common",
            slug: "majorResilient",
            traits: [],
        },
        4: {
            name: "AVANT.ArmorMythicResilientRune",
            level: 20,
            price: 70_000,
            rarity: "rare",
            slug: "mythicResilient",
            traits: ["mythic"],
        },
    },
};

// striking: "AVANT.ArmorStrikingRune",
// greaterStriking: "AVANT.ArmorGreaterStrikingRune",
// majorStriking: "AVANT.ArmorMajorStrikingRune",

interface FundamentalWeaponRuneData {
    potency: Record<ZeroToFour, PotencyRuneData | null>;
    striking: Record<ZeroToFour, SecondaryFundamentalRuneData<StrikingRuneType> | null>;
}
const FUNDAMENTAL_WEAPON_RUNE_DATA: FundamentalWeaponRuneData = {
    // https://2e.aonprd.com/Equipment.aspx?Category=23&Subcategory=25
    potency: {
        0: null,
        1: {
            name: "AVANT.WeaponPotencyRune1",
            value: 1,
            level: 2,
            price: 35,
            rarity: "common",
            traits: [],
        },
        2: {
            name: "AVANT.WeaponPotencyRune2",
            value: 2,
            level: 10,
            price: 935,
            rarity: "common",
            traits: [],
        },
        3: {
            name: "AVANT.WeaponPotencyRune3",
            value: 3,
            level: 16,
            price: 8935,
            rarity: "common",
            traits: [],
        },
        4: {
            name: "AVANT.WeaponPotencyRune4",
            value: 4,
            level: 20,
            price: 70_000,
            rarity: "rare",
            traits: ["mythic"],
        },
    },
    // https://2e.aonprd.com/Equipment.aspx?Category=23&Subcategory=25
    striking: {
        0: null,
        1: {
            name: "AVANT.Item.Weapon.Rune.Striking.Striking",
            level: 4,
            price: 65,
            rarity: "common",
            slug: "striking",
            traits: [],
        },
        2: {
            name: "AVANT.Item.Weapon.Rune.Striking.Greater",
            level: 12,
            price: 1065,
            rarity: "common",
            slug: "greaterStriking",
            traits: [],
        },
        3: {
            name: "AVANT.Item.Weapon.Rune.Striking.Major",
            level: 19,
            price: 31_065,
            rarity: "common",
            slug: "majorStriking",
            traits: [],
        },
        4: {
            name: "AVANT.Item.Weapon.Rune.Striking.Mythic",
            level: 20,
            price: 70_000,
            rarity: "rare",
            slug: "mythicStriking",
            traits: ["mythic"],
        },
    },
};

type FundamentalShieldRuneData = {
    reinforcing: Record<ZeroToSix, ReinforcingRuneData | null>;
};

const FUNDAMENTAL_SHIELD_RUNE_DATA: FundamentalShieldRuneData = {
    reinforcing: {
        0: null,
        1: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Minor",
            level: 4,
            price: 75,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 3, max: 8 },
            maxHP: { increase: 44, max: 64 },
        },
        2: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Lesser",
            level: 7,
            price: 300,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 3, max: 10 },
            maxHP: { increase: 52, max: 80 },
        },
        3: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Moderate",
            level: 10,
            price: 900,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 3, max: 13 },
            maxHP: { increase: 64, max: 104 },
        },
        4: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Greater",
            level: 13,
            price: 2500,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 5, max: 15 },
            maxHP: { increase: 80, max: 120 },
        },
        5: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Major",
            level: 16,
            price: 8000,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 5, max: 17 },
            maxHP: { increase: 84, max: 136 },
        },
        6: {
            name: "AVANT.Item.Shield.Rune.Reinforcing.Supreme",
            level: 19,
            price: 32_000,
            rarity: "common",
            traits: ["magical"],
            hardness: { increase: 7, max: 20 },
            maxHP: { increase: 108, max: 160 },
        },
    },
};

interface PropertyRuneData<TSlug extends string> extends RuneData {
    slug: TSlug;
}

interface ArmorPropertyRuneData<TSlug extends ArmorPropertyRuneType> extends PropertyRuneData<TSlug> {}

interface WeaponPropertyRuneData<TSlug extends WeaponPropertyRuneType> extends PropertyRuneData<TSlug> {
    attack?: {
        /** Degree-of-success adjustments */
        dosAdjustments?: DegreeOfSuccessAdjustment[];
        notes?: RuneNoteData[];
    };
    damage?: {
        additional?: RuneAdditionalDamage[];
        notes?: RuneNoteData[];
        adjustments?: ModifierAdjustment[];
        /**
         * A list of resistances this weapon's damage will ignore--not limited to damage from the rune.
         * If `max` is numeric, the resistance ignored will be equal to the lower of the provided maximum and the
         * target's resistance.
         */
        ignoredResistances?: { type: ResistanceType; max: number }[];
    };
    strikeAdjustments?: Pick<StrikeAdjustment, "adjustTraits" | "adjustWeapon">[];
}

/** Title and text are mandatory for these notes */
interface RuneNoteData extends Pick<RollNoteSource, "outcome" | "predicate" | "title" | "text"> {
    title: string;
    text: string;
}

// https://2e.aonprd.com/Equipment.aspx?Category=23&Subcategory=26
export const ARMOR_PROPERTY_RUNES: { [T in ArmorPropertyRuneType]: ArmorPropertyRuneData<T> } = {
    acidResistant: {
        name: "AVANT.ArmorPropertyRuneAcidResistant",
        level: 8,
        price: 420,
        rarity: "common",
        slug: "acidResistant",
        traits: ["magical"],
    },
    advancing: {
        name: "AVANT.ArmorPropertyRuneAdvancing",
        level: 9,
        price: 625,
        rarity: "common",
        slug: "advancing",
        traits: ["magical"],
    },
    aimAiding: {
        name: "AVANT.ArmorPropertyRuneAimAiding",
        level: 6,
        price: 225,
        rarity: "common",
        slug: "aimAiding",
        traits: ["magical"],
    },
    antimagic: {
        name: "AVANT.ArmorPropertyRuneAntimagic",
        level: 15,
        price: 6500,
        rarity: "uncommon",
        slug: "antimagic",
        traits: ["magical"],
    },
    assisting: {
        name: "AVANT.ArmorPropertyRuneAssisting",
        level: 5,
        price: 125,
        rarity: "common",
        slug: "assisting",
        traits: ["magical"],
    },
    bitter: {
        name: "AVANT.ArmorPropertyRuneBitter",
        level: 9,
        price: 135,
        rarity: "uncommon",
        slug: "bitter",
        traits: ["magical", "poison"],
    },
    coldResistant: {
        name: "AVANT.ArmorPropertyRuneColdResistant",
        level: 8,
        price: 420,
        rarity: "common",
        slug: "coldResistant",
        traits: ["magical"],
    },
    deathless: {
        name: "AVANT.ArmorPropertyRuneDeathless",
        level: 7,
        price: 330,
        rarity: "uncommon",
        slug: "deathless",
        traits: ["healing", "magical"],
    },
    electricityResistant: {
        name: "AVANT.ArmorPropertyRuneElectricityResistant",
        level: 8,
        price: 420,
        rarity: "common",
        slug: "electricityResistant",
        traits: ["magical"],
    },
    energyAdaptive: {
        name: "AVANT.ArmorPropertyRuneEnergyAdaptive",
        level: 13,
        price: 2600,
        rarity: "common",
        slug: "energyAdaptive",
        traits: ["magical"],
    },
    ethereal: {
        name: "AVANT.ArmorPropertyRuneEthereal",
        level: 17,
        price: 13_500,
        rarity: "common",
        slug: "ethereal",
        traits: ["magical"],
    },
    fireResistant: {
        name: "AVANT.ArmorPropertyRuneFireResistant",
        level: 8,
        price: 420,
        rarity: "common",
        slug: "fireResistant",
        traits: ["magical"],
    },
    fortification: {
        name: "AVANT.ArmorPropertyRuneFortification",
        level: 12,
        price: 2000,
        rarity: "common",
        slug: "fortification",
        traits: ["magical"],
    },
    glamered: {
        name: "AVANT.ArmorPropertyRuneGlamered",
        level: 5,
        price: 140,
        rarity: "common",
        slug: "glamered",
        traits: ["illusion", "magical"],
    },
    gliding: {
        name: "AVANT.ArmorPropertyRuneGliding",
        level: 8,
        price: 450,
        rarity: "common",
        slug: "gliding",
        traits: ["magical"],
    },
    greaterAcidResistant: {
        name: "AVANT.ArmorPropertyRuneGreaterAcidResistant",
        level: 12,
        price: 1650,
        rarity: "common",
        slug: "greaterAcidResistant",
        traits: ["magical"],
    },
    greaterAdvancing: {
        name: "AVANT.ArmorPropertyRuneGreaterAdvancing",
        level: 16,
        price: 8000,
        rarity: "common",
        slug: "greaterAdvancing",
        traits: ["magical"],
    },
    greaterColdResistant: {
        name: "AVANT.ArmorPropertyRuneGreaterColdResistant",
        level: 12,
        price: 1650,
        rarity: "common",
        slug: "greaterColdResistant",
        traits: ["magical"],
    },
    greaterDread: {
        name: "AVANT.ArmorPropertyRuneGreaterDread",
        level: 18,
        price: 21_000,
        rarity: "uncommon",
        slug: "greaterDread",
        traits: ["emotion", "fear", "magical", "mental", "visual"],
    },
    greaterElectricityResistant: {
        name: "AVANT.ArmorPropertyRuneGreaterElectricityResistant",
        level: 12,
        price: 1650,
        rarity: "common",
        slug: "greaterElectricityResistant",
        traits: ["magical"],
    },
    greaterFireResistant: {
        name: "AVANT.ArmorPropertyRuneGreaterFireResistant",
        level: 12,
        price: 1650,
        rarity: "common",
        slug: "greaterFireResistant",
        traits: ["magical"],
    },
    greaterFortification: {
        name: "AVANT.ArmorPropertyRuneGreaterFortification",
        level: 19,
        price: 24_000,
        rarity: "common",
        slug: "greaterFortification",
        traits: ["magical"],
    },
    greaterInvisibility: {
        name: "AVANT.ArmorPropertyRuneGreaterInvisibility",
        level: 10,
        price: 1000,
        rarity: "common",
        slug: "greaterInvisibility",
        traits: ["illusion", "magical"],
    },
    greaterReady: {
        name: "AVANT.ArmorPropertyRuneGreaterReady",
        level: 11,
        price: 1200,
        rarity: "common",
        slug: "greaterReady",
        traits: ["magical"],
    },
    greaterShadow: {
        name: "AVANT.ArmorPropertyRuneGreaterShadow",
        level: 9,
        price: 650,
        rarity: "common",
        slug: "greaterShadow",
        traits: ["magical"],
    },
    greaterSlick: {
        name: "AVANT.ArmorPropertyRuneGreaterSlick",
        level: 8,
        price: 450,
        rarity: "common",
        slug: "greaterSlick",
        traits: ["magical"],
    },
    greaterStanching: {
        name: "AVANT.ArmorPropertyRuneGreaterStanching",
        level: 9,
        price: 600,
        rarity: "uncommon",
        slug: "greaterStanching",
        traits: ["magical"],
    },
    greaterQuenching: {
        name: "AVANT.ArmorPropertyRuneGreaterQuenching",
        level: 10,
        price: 1000,
        rarity: "common",
        slug: "greaterQuenching",
        traits: ["magical"],
    },
    greaterSwallowSpike: {
        name: "AVANT.ArmorPropertyRuneGreaterSwallowSpike",
        level: 12,
        price: 1750,
        rarity: "common",
        slug: "greaterSwallowSpike",
        traits: ["magical"],
    },
    greaterWinged: {
        name: "AVANT.ArmorPropertyRuneGreaterWinged",
        level: 19,
        price: 35_000,
        rarity: "common",
        slug: "greaterWinged",
        traits: ["magical"],
    },
    immovable: {
        name: "AVANT.ArmorPropertyRuneImmovable",
        level: 12,
        price: 1800,
        rarity: "uncommon",
        slug: "immovable",
        traits: ["magical"],
    },
    implacable: {
        name: "AVANT.ArmorPropertyRuneImplacable",
        level: 11,
        price: 1200,
        rarity: "uncommon",
        slug: "implacable",
        traits: ["magical"],
    },
    invisibility: {
        name: "AVANT.ArmorPropertyRuneInvisibility",
        level: 8,
        price: 500,
        rarity: "common",
        slug: "invisibility",
        traits: ["illusion", "magical"],
    },
    lesserDread: {
        name: "AVANT.ArmorPropertyRuneLesserDread",
        level: 6,
        price: 225,
        rarity: "uncommon",
        slug: "lesserDread",
        traits: ["emotion", "fear", "magical", "mental", "visual"],
    },
    magnetizing: {
        name: "AVANT.ArmorPropertyRuneMagnetizing",
        level: 10,
        price: 900,
        rarity: "common",
        slug: "magnetizing",
        traits: ["magical"],
    },
    majorQuenching: {
        name: "AVANT.ArmorPropertyRuneMajorQuenching",
        level: 14,
        price: 4500,
        rarity: "common",
        slug: "majorQuenching",
        traits: ["magical"],
    },
    majorShadow: {
        name: "AVANT.ArmorPropertyRuneMajorShadow",
        level: 17,
        price: 14_000,
        rarity: "common",
        slug: "majorShadow",
        traits: ["magical"],
    },
    majorSlick: {
        name: "AVANT.ArmorPropertyRuneMajorSlick",
        level: 16,
        price: 9000,
        rarity: "common",
        slug: "majorSlick",
        traits: ["magical"],
    },
    majorStanching: {
        name: "AVANT.ArmorPropertyRuneMajorStanching",
        level: 13,
        price: 2500,
        rarity: "uncommon",
        slug: "majorStanching",
        traits: ["magical"],
    },
    majorSwallowSpike: {
        name: "AVANT.ArmorPropertyRuneMajorSwallowSpike",
        level: 16,
        price: 19_250,
        rarity: "common",
        slug: "majorSwallowSpike",
        traits: ["magical"],
    },
    malleable: {
        name: "AVANT.ArmorPropertyRuneMalleable",
        level: 9,
        price: 650,
        rarity: "common",
        slug: "malleable",
        traits: ["magical", "metal"],
    },
    misleading: {
        name: "AVANT.ArmorPropertyRuneMisleading",
        level: 16,
        price: 8000,
        rarity: "common",
        slug: "misleading",
        traits: ["illusion", "magical"],
    },
    moderateDread: {
        name: "AVANT.ArmorPropertyRuneModerateDread",
        level: 12,
        price: 1800,
        rarity: "uncommon",
        slug: "moderateDread",
        traits: ["emotion", "fear", "magical", "mental", "visual"],
    },
    portable: {
        name: "AVANT.ArmorPropertyRunePortable",
        level: 9,
        price: 660,
        rarity: "common",
        slug: "portable",
        traits: ["magical"],
    },
    quenching: {
        name: "AVANT.ArmorPropertyRuneQuenching",
        level: 6,
        price: 250,
        rarity: "common",
        slug: "quenching",
        traits: ["magical"],
    },
    raiment: {
        name: "AVANT.ArmorPropertyRuneRaiment",
        level: 5,
        price: 140,
        rarity: "common",
        slug: "raiment",
        traits: ["illusion", "magical"],
    },
    ready: {
        name: "AVANT.ArmorPropertyRuneReady",
        level: 6,
        price: 200,
        rarity: "common",
        slug: "ready",
        traits: ["magical"],
    },
    rockBraced: {
        name: "AVANT.ArmorPropertyRuneRockBraced",
        level: 13,
        price: 3000,
        rarity: "rare",
        slug: "rockBraced",
        traits: ["dwarf", "magical", "saggorak"],
    },
    shadow: {
        name: "AVANT.ArmorPropertyRuneShadow",
        level: 5,
        price: 55,
        rarity: "common",
        slug: "shadow",
        traits: ["magical"],
    },
    sinisterKnight: {
        name: "AVANT.ArmorPropertyRuneSinisterKnight",
        level: 8,
        price: 500,
        rarity: "uncommon",
        slug: "sinisterKnight",
        traits: ["illusion", "magical"],
    },
    sizeChanging: {
        name: "AVANT.ArmorPropertyRuneSizeChanging",
        level: 7,
        price: 350,
        rarity: "common",
        slug: "sizeChanging",
        traits: ["magical"],
    },
    slick: {
        name: "AVANT.ArmorPropertyRuneSlick",
        level: 5,
        price: 45,
        rarity: "common",
        slug: "slick",
        traits: ["magical"],
    },
    soaring: {
        name: "AVANT.ArmorPropertyRuneSoaring",
        level: 14,
        price: 3750,
        rarity: "common",
        slug: "soaring",
        traits: ["magical"],
    },
    stanching: {
        name: "AVANT.ArmorPropertyRuneStanching",
        level: 5,
        price: 130,
        rarity: "uncommon",
        slug: "stanching",
        traits: ["magical"],
    },
    swallowSpike: {
        name: "AVANT.ArmorPropertyRuneSwallowSpike",
        level: 6,
        price: 200,
        rarity: "common",
        slug: "swallowSpike",
        traits: ["magical"],
    },
    trueQuenching: {
        name: "AVANT.ArmorPropertyRuneTrueQuenching",
        level: 18,
        price: 24_000,
        rarity: "common",
        slug: "trueQuenching",
        traits: ["magical"],
    },
    trueStanching: {
        name: "AVANT.ArmorPropertyRuneTrueStanching",
        level: 17,
        price: 12_500,
        rarity: "uncommon",
        slug: "trueStanching",
        traits: ["magical"],
    },
    winged: {
        name: "AVANT.ArmorPropertyRuneWinged",
        level: 13,
        price: 2500,
        rarity: "common",
        slug: "winged",
        traits: ["magical"],
    },
};

// https://2e.aonprd.com/Equipment.aspx?Category=23&Subcategory=27
const WEAPON_PROPERTY_RUNES: { [T in WeaponPropertyRuneType]: WeaponPropertyRuneData<T> } = {
    ancestralEchoing: {
        level: 15,
        name: "AVANT.WeaponPropertyRune.ancestralEchoing.Name",
        price: 9500,
        rarity: "rare",
        slug: "ancestralEchoing",
        traits: ["dwarf", "magical", "saggorak"],
    },
    anchoring: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.anchoring.Name",
                    text: "AVANT.WeaponPropertyRune.anchoring.Note.criticalSuccess",
                },
            ],
        },
        level: 10,
        name: "AVANT.WeaponPropertyRune.anchoring.Name",
        price: 900,
        rarity: "uncommon",
        slug: "anchoring",
        traits: ["magical"],
    },
    ashen: {
        damage: {
            additional: [
                {
                    damageType: "fire",
                    category: "persistent",
                    diceNumber: 1,
                    dieSize: "d4",
                },
            ],
            notes: [
                {
                    title: "AVANT.WeaponPropertyRune.ashen.Name",
                    text: "AVANT.WeaponPropertyRune.ashen.Note.success",
                },
            ],
        },
        level: 9,
        name: "AVANT.WeaponPropertyRune.ashen.Name",
        price: 700,
        rarity: "common",
        slug: "ashen",
        traits: ["magical"],
    },
    astral: {
        level: 8,
        name: "AVANT.WeaponPropertyRune.astral.Name",
        price: 450,
        rarity: "common",
        slug: "astral",
        traits: ["magical", "spirit"],
        damage: {
            additional: [{ damageType: "spirit", diceNumber: 1, dieSize: "d6" }],
        },
    },
    authorized: {
        level: 3,
        name: "AVANT.WeaponPropertyRune.authorized.Name",
        price: 50,
        rarity: "common",
        slug: "authorized",
        traits: ["magical"],
    },
    bane: {
        level: 4,
        name: "AVANT.WeaponPropertyRune.bane.Name",
        price: 100,
        rarity: "uncommon",
        slug: "bane",
        traits: ["magical"],
    },
    bloodbane: {
        level: 8,
        name: "AVANT.WeaponPropertyRune.bloodbane.Name",
        price: 475,
        rarity: "uncommon",
        slug: "bloodbane",
        traits: ["dwarf", "magical"],
    },
    bloodthirsty: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.bloodbane.Name",
                    text: "AVANT.WeaponPropertyRune.bloodthirsty.Note.criticalSuccess",
                },
            ],
        },
        level: 16,
        name: "AVANT.WeaponPropertyRune.bloodthirsty.Name",
        price: 8500,
        rarity: "uncommon",
        slug: "bloodthirsty",
        traits: ["magical"],
    },
    brilliant: {
        damage: {
            additional: [
                { damageType: "fire", diceNumber: 1, dieSize: "d4" },
                {
                    damageType: "spirit",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: ["target:trait:fiend"],
                },
                {
                    damageType: "vitality",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: ["target:negative-healing"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.brilliant.Name",
                    text: "AVANT.WeaponPropertyRune.brilliant.Note.criticalSuccess",
                },
            ],
        },
        level: 12,
        name: "AVANT.WeaponPropertyRune.brilliant.Name",
        price: 2000,
        rarity: "common",
        slug: "brilliant",
        traits: ["magical"],
    },
    called: {
        level: 7,
        name: "AVANT.WeaponPropertyRune.called.Name",
        price: 350,
        rarity: "common",
        slug: "called",
        traits: ["magical"],
    },
    coating: {
        level: 9,
        name: "AVANT.WeaponPropertyRune.coating.Name",
        price: 700,
        rarity: "common",
        slug: "coating",
        traits: ["extradimensional", "magical"],
    },
    conducting: {
        level: 7,
        name: "AVANT.WeaponPropertyRune.conducting.Name",
        price: 300,
        rarity: "common",
        slug: "conducting",
        traits: ["magical"],
    },
    corrosive: {
        damage: {
            additional: [{ damageType: "acid", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.corrosive.Name",
                    text: "AVANT.WeaponPropertyRune.corrosive.Note.criticalSuccess",
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.corrosive.Name",
        price: 500,
        rarity: "common",
        slug: "corrosive",
        traits: ["acid", "magical"],
    },
    crushing: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.crushing.Name",
                    text: "AVANT.WeaponPropertyRune.crushing.Note.criticalSuccess",
                },
            ],
        },
        level: 3,
        name: "AVANT.WeaponPropertyRune.crushing.Name",
        price: 50,
        rarity: "uncommon",
        slug: "crushing",
        traits: ["magical"],
    },
    cunning: {
        level: 5,
        name: "AVANT.WeaponPropertyRune.cunning.Name",
        price: 140,
        rarity: "common",
        slug: "cunning",
        traits: ["magical"],
    },
    dancing: {
        level: 13,
        name: "AVANT.WeaponPropertyRune.dancing.Name",
        price: 2700,
        rarity: "uncommon",
        slug: "dancing",
        traits: ["magical"],
    },
    decaying: {
        damage: {
            additional: [
                {
                    slug: "decaying",
                    damageType: "void",
                    diceNumber: 1,
                    dieSize: "d4",
                },
                {
                    slug: "decaying-persistent",
                    category: "persistent",
                    damageType: "void",
                    diceNumber: 2,
                    dieSize: "d4",
                    critical: true,
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.decaying.Name",
        price: 500,
        rarity: "common",
        slug: "decaying",
        traits: ["acid", "magical", "void"],
    },
    deathdrinking: {
        damage: {
            additional: [
                {
                    slug: "deathdrinking-negative",
                    damageType: "void",
                    diceNumber: 1,
                    dieSize: "d6",
                    critical: true,
                    predicate: ["target:mode:living", { not: "target:negative-healing" }],
                },
                {
                    slug: "deathdrinking-positive",
                    damageType: "vitality",
                    diceNumber: 1,
                    dieSize: "d6",
                    critical: true,
                    predicate: ["target:negative-healing"],
                },
            ],
        },
        level: 7,
        name: "AVANT.WeaponPropertyRune.deathdrinking.Name",
        price: 360,
        rarity: "rare",
        slug: "deathdrinking",
        traits: ["magical"],
    },
    demolishing: {
        damage: {
            additional: [
                {
                    damageType: "force",
                    category: "persistent",
                    diceNumber: 1,
                    dieSize: "d6",
                    predicate: ["target:trait:construct"],
                },
            ],
        },
        level: 6,
        name: "AVANT.WeaponPropertyRune.demolishing.Name",
        price: 225,
        rarity: "rare",
        slug: "demolishing",
        traits: ["magical"],
    },
    disrupting: {
        damage: {
            additional: [
                {
                    category: "persistent",
                    damageType: "vitality",
                    diceNumber: 1,
                    dieSize: "d6",
                    predicate: ["target:negative-healing"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.disrupting.Name",
                    text: "AVANT.WeaponPropertyRune.disrupting.Note.criticalSuccess",
                    predicate: ["target:negative-healing"],
                },
            ],
        },
        level: 5,
        name: "AVANT.WeaponPropertyRune.disrupting.Name",
        price: 150,
        rarity: "common",
        slug: "disrupting",
        traits: ["magical"],
    },
    earthbinding: {
        level: 5,
        name: "AVANT.WeaponPropertyRune.earthbinding.Name",
        price: 125,
        rarity: "common",
        slug: "earthbinding",
        traits: ["magical"],
    },
    energizing: {
        level: 6,
        name: "AVANT.WeaponPropertyRune.energizing.Name",
        price: 250,
        rarity: "uncommon",
        slug: "energizing",
        traits: ["magical"],
    },
    extending: {
        level: 7,
        name: "AVANT.WeaponPropertyRune.extending.Name",
        price: 700,
        rarity: "common",
        slug: "extending",
        traits: ["magical"],
    },
    fanged: {
        level: 2,
        name: "AVANT.WeaponPropertyRune.fanged.Name",
        price: 30,
        rarity: "uncommon",
        slug: "fanged",
        traits: ["magical"],
    },
    fearsome: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.fearsome.Name",
                    text: "AVANT.WeaponPropertyRune.fearsome.Note.criticalSuccess",
                },
            ],
        },
        level: 5,
        name: "AVANT.WeaponPropertyRune.fearsome.Name",
        price: 160,
        rarity: "common",
        slug: "fearsome",
        traits: ["emotion", "fear", "magical", "mental"],
    },
    flaming: {
        damage: {
            additional: [
                { damageType: "fire", diceNumber: 1, dieSize: "d6" },
                {
                    damageType: "fire",
                    category: "persistent",
                    diceNumber: 1,
                    dieSize: "d10",
                    critical: true,
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.flaming.Name",
        price: 500,
        rarity: "common",
        slug: "flaming",
        traits: ["fire", "magical"],
    },
    flickering: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.flickering.Name",
                    text: "AVANT.WeaponPropertyRune.flickering.Note.criticalSuccess",
                },
            ],
        },
        level: 6,
        name: "AVANT.WeaponPropertyRune.flickering.Name",
        price: 250,
        rarity: "uncommon",
        slug: "flickering",
        traits: ["illusion", "magical"],
    },
    flurrying: {
        level: 7,
        name: "AVANT.WeaponPropertyRune.flurrying.Name",
        price: 360,
        rarity: "common",
        slug: "flurrying",
        traits: ["magical"],
    },
    frost: {
        damage: {
            additional: [{ damageType: "cold", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.frost.Name",
                    text: "AVANT.WeaponPropertyRune.frost.Note.criticalSuccess",
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.frost.Name",
        price: 500,
        rarity: "common",
        slug: "frost",
        traits: ["cold", "magical"],
    },
    ghostTouch: {
        level: 4,
        name: "AVANT.WeaponPropertyRune.ghostTouch.Name",
        price: 75,
        rarity: "common",
        slug: "ghostTouch",
        traits: ["magical"],
    },
    giantKilling: {
        damage: {
            additional: [
                {
                    slug: "giantKilling",
                    damageType: "mental",
                    diceNumber: 1,
                    dieSize: "d6",
                    predicate: ["target:trait:giant"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["target:trait:giant"],
                    title: "AVANT.WeaponPropertyRune.giantKilling.Name",
                    text: "AVANT.WeaponPropertyRune.giantKilling.Note.criticalSuccess",
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.giantKilling.Name",
        price: 450,
        rarity: "rare",
        slug: "giantKilling",
        traits: ["magical"],
    },
    greaterAnchoring: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterAnchoring.Name",
                    text: "AVANT.WeaponPropertyRune.greaterAnchoring.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterAnchoring.Name",
                    text: "AVANT.WeaponPropertyRune.greaterAnchoring.Note.success",
                },
            ],
        },
        level: 18,
        name: "AVANT.WeaponPropertyRune.greaterAnchoring.Name",
        price: 22_000,
        rarity: "uncommon",
        slug: "greaterAnchoring",
        traits: ["magical"],
    },
    greaterAshen: {
        damage: {
            additional: [
                {
                    damageType: "fire",
                    category: "persistent",
                    diceNumber: 1,
                    dieSize: "d8",
                },
            ],
            notes: [
                {
                    title: "AVANT.WeaponPropertyRune.greaterAshen.Name",
                    text: "AVANT.WeaponPropertyRune.greaterAshen.Note.success",
                },
            ],
        },
        level: 16,
        name: "AVANT.WeaponPropertyRune.greaterAshen.Name",
        price: 9000,
        rarity: "common",
        slug: "greaterAshen",
        traits: ["magical"],
    },
    greaterAstral: {
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterAstral.Name",
        price: 6000,
        rarity: "common",
        slug: "greaterAstral",
        traits: ["magical", "spirit"],
        damage: {
            additional: [{ damageType: "spirit", diceNumber: 1, dieSize: "d6" }],
            ignoredResistances: [{ type: "spirit", max: Infinity }],
        },
    },
    greaterBloodbane: {
        level: 13,
        name: "AVANT.WeaponPropertyRune.greaterBloodbane.Name",
        price: 2800,
        rarity: "uncommon",
        slug: "greaterBloodbane",
        traits: ["dwarf", "magical"],
    },
    greaterBrilliant: {
        damage: {
            additional: [
                { damageType: "fire", diceNumber: 1, dieSize: "d4" },
                {
                    damageType: "spirit",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: ["target:trait:fiend"],
                },
                {
                    damageType: "vitality",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: ["target:negative-healing"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterBrilliant.Name",
                    text: "AVANT.WeaponPropertyRune.greaterBrilliant.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterBrilliant.Name",
                    text: "AVANT.WeaponPropertyRune.greaterBrilliant.Note.success",
                },
            ],
            ignoredResistances: [
                { type: "fire", max: Infinity },
                { type: "spirit", max: Infinity },
                { type: "vitality", max: Infinity },
            ],
        },
        level: 18,
        name: "AVANT.WeaponPropertyRune.greaterBrilliant.Name",
        price: 24_000,
        rarity: "common",
        slug: "greaterBrilliant",
        traits: ["magical"],
    },
    greaterCorrosive: {
        damage: {
            additional: [{ damageType: "acid", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterCorrosive.Name",
                    text: "AVANT.WeaponPropertyRune.greaterCorrosive.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterCorrosive.Name",
                    text: "AVANT.WeaponPropertyRune.greaterCorrosive.Note.success",
                },
            ],
            ignoredResistances: [{ type: "acid", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterCorrosive.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterCorrosive",
        traits: ["acid", "magical"],
    },
    greaterCrushing: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterCrushing.Name",
                    text: "AVANT.WeaponPropertyRune.greaterCrushing.Note.criticalSuccess",
                },
            ],
        },
        level: 9,
        name: "AVANT.WeaponPropertyRune.greaterCrushing.Name",
        price: 650,
        rarity: "uncommon",
        slug: "greaterCrushing",
        traits: ["magical"],
    },
    greaterDecaying: {
        damage: {
            additional: [
                {
                    slug: "decaying",
                    damageType: "void",
                    diceNumber: 1,
                    dieSize: "d4",
                },
                {
                    slug: "decaying-persistent",
                    category: "persistent",
                    damageType: "void",
                    diceNumber: 4,
                    dieSize: "d4",
                    critical: true,
                },
            ],
            ignoredResistances: [{ type: "void", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterDecaying.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterDecaying",
        traits: ["acid", "magical", "void"],
    },
    greaterDisrupting: {
        damage: {
            additional: [
                {
                    category: "persistent",
                    damageType: "vitality",
                    diceNumber: 2,
                    dieSize: "d6",
                    predicate: ["target:negative-healing"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterDisrupting.Name",
                    text: "AVANT.WeaponPropertyRune.greaterDisrupting.Note.criticalSuccess",
                    predicate: ["target:negative-healing"],
                },
            ],
        },
        level: 14,
        name: "AVANT.WeaponPropertyRune.greaterDisrupting.Name",
        price: 4300,
        rarity: "uncommon",
        slug: "greaterDisrupting",
        traits: ["magical"],
    },
    greaterExtending: {
        level: 13,
        name: "AVANT.WeaponPropertyRune.greaterExtending.Name",
        price: 3000,
        rarity: "common",
        slug: "greaterExtending",
        traits: ["magical"],
    },
    greaterFanged: {
        level: 8,
        name: "AVANT.WeaponPropertyRune.greaterFanged.Name",
        price: 425,
        rarity: "uncommon",
        slug: "greaterFanged",
        traits: ["magical"],
    },
    greaterFearsome: {
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterFearsome.Name",
                    text: "AVANT.WeaponPropertyRune.greaterFearsome.Note.criticalSuccess",
                },
            ],
        },
        level: 12,
        name: "AVANT.WeaponPropertyRune.greaterFearsome.Name",
        price: 2000,
        rarity: "common",
        slug: "greaterFearsome",
        traits: ["emotion", "fear", "magical", "mental"],
    },
    greaterFlaming: {
        damage: {
            additional: [
                { damageType: "fire", diceNumber: 1, dieSize: "d6" },
                {
                    damageType: "fire",
                    category: "persistent",
                    diceNumber: 2,
                    dieSize: "d10",
                    critical: true,
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterFlaming.Name",
                    text: "AVANT.WeaponPropertyRune.greaterFlaming.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterFlaming.Name",
                    text: "AVANT.WeaponPropertyRune.greaterFlaming.Note.success",
                },
            ],
            ignoredResistances: [{ type: "fire", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterFlaming.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterFlaming",
        traits: ["fire", "magical"],
    },
    greaterFrost: {
        damage: {
            additional: [{ damageType: "cold", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterFrost.Name",
                    text: "AVANT.WeaponPropertyRune.greaterFrost.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterFrost.Name",
                    text: "AVANT.WeaponPropertyRune.greaterFrost.Note.success",
                },
            ],
            ignoredResistances: [{ type: "cold", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterFrost.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterFrost",
        traits: ["cold", "magical"],
    },
    greaterGiantKilling: {
        damage: {
            additional: [
                {
                    slug: "greaterGiantKilling",
                    damageType: "mental",
                    diceNumber: 2,
                    dieSize: "d6",
                    predicate: ["target:trait:giant"],
                },
            ],
            ignoredResistances: [{ type: "mental", max: Infinity }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["target:trait:giant"],
                    title: "AVANT.WeaponPropertyRune.greaterGiantKilling.Name",
                    text: "AVANT.WeaponPropertyRune.greaterGiantKilling.Note.criticalSuccess",
                },
            ],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterGiantKilling.Name",
        price: 6000,
        rarity: "rare",
        slug: "greaterGiantKilling",
        traits: ["magical"],
    },
    greaterHauling: {
        level: 11,
        name: "AVANT.WeaponPropertyRune.greaterHauling.Name",
        price: 1300,
        rarity: "uncommon",
        slug: "greaterHauling",
        traits: ["magical"],
    },
    greaterImpactful: {
        damage: {
            additional: [{ damageType: "force", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterImpactful.Name",
                    text: "AVANT.WeaponPropertyRune.greaterImpactful.Note.criticalSuccess",
                },
            ],
        },
        level: 17,
        name: "AVANT.WeaponPropertyRune.greaterImpactful.Name",
        price: 15_000,
        rarity: "common",
        slug: "greaterImpactful",
        traits: ["force", "magical"],
    },
    greaterRooting: {
        level: 11,
        name: "AVANT.WeaponPropertyRune.greaterRooting.Name",
        price: 1400,
        rarity: "common",
        slug: "greaterRooting",
        traits: ["plant", "magical", "wood"],
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterRooting.Name",
                    text: "AVANT.WeaponPropertyRune.greaterRooting.Note.criticalSuccess",
                },
            ],
        },
    },
    greaterShock: {
        damage: {
            additional: [{ damageType: "electricity", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterShock.Name",
                    text: "AVANT.WeaponPropertyRune.greaterShock.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterShock.Name",
                    text: "AVANT.WeaponPropertyRune.greaterShock.Note.success",
                },
            ],
            ignoredResistances: [{ type: "electricity", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterShock.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterShock",
        traits: ["electricity", "magical"],
    },
    greaterThundering: {
        damage: {
            additional: [{ damageType: "sonic", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.greaterThundering.Name",
                    text: "AVANT.WeaponPropertyRune.greaterThundering.Note.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    title: "AVANT.WeaponPropertyRune.greaterThundering.Name",
                    text: "AVANT.WeaponPropertyRune.greaterThundering.Note.success",
                },
            ],
            ignoredResistances: [{ type: "sonic", max: Infinity }],
        },
        level: 15,
        name: "AVANT.WeaponPropertyRune.greaterThundering.Name",
        price: 6500,
        rarity: "common",
        slug: "greaterThundering",
        traits: ["magical", "sonic"],
    },
    grievous: {
        damage: {
            additional: [
                {
                    damageType: "bleed",
                    diceNumber: 1,
                    dieSize: "d6",
                    critical: true,
                    predicate: ["critical-specialization", "item:group:dart"],
                },
            ],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:axe"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Axe",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:bow"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Bow",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: [{ or: ["item:group:brawling", "item:group:firearm"] }],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Brawling",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:club"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Club",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:crossbow"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Crossbow",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:flail"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Flail",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:hammer"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Hammer",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:knife"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Knife",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:polearm"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Polearm",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:shield"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Shield",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:sling"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Sling",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:spear"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Spear",
                },
                {
                    outcome: ["criticalSuccess"],
                    predicate: ["item:group:sword"],
                    title: "AVANT.WeaponPropertyRune.grievous.Name",
                    text: "AVANT.WeaponPropertyRune.grievous.Note.Sword",
                },
            ],
            adjustments: [
                {
                    slug: "critical-specialization",
                    test: (options): boolean => new Predicate("item:group:pick").test(options),
                    getNewValue: (current) => current * 2,
                },
            ],
        },
        level: 9,
        name: "AVANT.WeaponPropertyRune.grievous.Name",
        price: 700,
        rarity: "common",
        slug: "grievous",
        traits: ["magical"],
    },
    hauling: {
        level: 6,
        name: "AVANT.WeaponPropertyRune.hauling.Name",
        price: 225,
        rarity: "uncommon",
        slug: "hauling",
        traits: ["magical"],
    },
    holy: {
        level: 11,
        name: "AVANT.WeaponPropertyRune.holy.Name",
        price: 1400,
        rarity: "common",
        slug: "holy",
        traits: ["holy", "magical"],
        damage: {
            additional: [
                {
                    damageType: "spirit",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: [{ not: "target:trait:unholy" }],
                },
                {
                    damageType: "spirit",
                    diceNumber: 2,
                    dieSize: "d4",
                    predicate: ["target:trait:unholy"],
                },
            ],
        },
        strikeAdjustments: [
            {
                adjustTraits: (_weapon: WeaponAvant | MeleeAvant, traits: AbilityTrait[]): void => {
                    if (!traits.includes("holy")) traits.push("holy");
                },
            },
        ],
    },
    hopeful: {
        attack: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.hopeful.Name",
                    text: "AVANT.WeaponPropertyRune.hopeful.Note.criticalSuccess",
                },
            ],
        },
        level: 11,
        name: "AVANT.WeaponPropertyRune.hopeful.Name",
        price: 1200,
        rarity: "uncommon",
        slug: "hopeful",
        traits: ["magical"],
    },
    hooked: {
        level: 5,
        name: "AVANT.WeaponPropertyRune.hooked.Name",
        price: 140,
        rarity: "rare",
        slug: "hooked",
        traits: ["magical"],
        strikeAdjustments: [
            {
                adjustWeapon: (weapon: WeaponAvant | MeleeAvant): void => {
                    if (!weapon.system.traits.value.includes("trip")) {
                        weapon.system.traits.value.push("trip");
                    }
                },
            },
        ],
    },
    impactful: {
        damage: {
            additional: [{ damageType: "force", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.impactful.Name",
                    text: "AVANT.WeaponPropertyRune.impactful.Note.criticalSuccess",
                },
            ],
        },
        level: 10,
        name: "AVANT.WeaponPropertyRune.impactful.Name",
        price: 1000,
        rarity: "common",
        slug: "impactful",
        traits: ["force", "magical"],
    },
    impossible: {
        level: 20,
        name: "AVANT.WeaponPropertyRune.impossible.Name",
        price: 70_000,
        rarity: "common",
        slug: "impossible",
        traits: ["magical"],
        strikeAdjustments: [
            {
                // Double the base range increment
                adjustWeapon: (weapon: WeaponAvant | MeleeAvant): void => {
                    if (weapon.isOfType("weapon") && weapon.system.range && weapon._source.system.range) {
                        const sourceRange = weapon._source.system.range;
                        const preparedRange = weapon.system.range;
                        weapon.system.range = (sourceRange * 2 +
                            Math.abs(preparedRange - sourceRange)) as WeaponRangeIncrement;
                    }
                },
            },
        ],
    },
    keen: {
        attack: {
            dosAdjustments: [
                {
                    adjustments: { success: { label: "AVANT.WeaponPropertyRune.keen.Name", amount: "criticalSuccess" } },
                    predicate: new Predicate([
                        "check:total:natural:19",
                        { or: ["item:damage:type:slashing", "item:damage:type:piercing"] },
                    ]),
                },
            ],
        },
        level: 13,
        name: "AVANT.WeaponPropertyRune.keen.Name",
        price: 3000,
        rarity: "uncommon",
        slug: "keen",
        traits: ["magical"],
    },
    kinWarding: {
        level: 3,
        name: "AVANT.WeaponPropertyRune.kinWarding.Name",
        price: 52,
        rarity: "uncommon",
        slug: "kinWarding",
        traits: ["dwarf", "magical"],
    },
    majorFanged: {
        level: 15,
        name: "AVANT.WeaponPropertyRune.majorFanged.Name",
        price: 6000,
        rarity: "uncommon",
        slug: "majorFanged",
        traits: ["magical"],
    },
    majorRooting: {
        level: 15,
        name: "AVANT.WeaponPropertyRune.majorRooting.Name",
        price: 6500,
        rarity: "common",
        slug: "majorRooting",
        traits: ["plant", "magical", "wood"],
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.majorRooting.Name",
                    text: "AVANT.WeaponPropertyRune.majorRooting.Note.criticalSuccess",
                },
            ],
        },
    },
    merciful: {
        strikeAdjustments: [
            {
                adjustWeapon: (weapon: WeaponAvant | MeleeAvant): void => {
                    if (!weapon.system.traits.value.includes("nonlethal")) {
                        weapon.system.traits.value.push("nonlethal");
                    }
                },
            },
        ],
        level: 4,
        name: "AVANT.WeaponPropertyRune.merciful.Name",
        price: 70,
        rarity: "common",
        slug: "merciful",
        traits: ["magical", "mental"],
    },
    nightmare: {
        damage: {
            additional: [{ damageType: "mental", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.nightmare.Name",
                    text: "AVANT.WeaponPropertyRune.nightmare.Note.criticalSuccess",
                },
            ],
        },
        level: 9,
        name: "AVANT.WeaponPropertyRune.nightmare.Name",
        price: 250,
        rarity: "uncommon",
        slug: "nightmare",
        traits: ["magical"],
    },
    pacifying: {
        level: 5,
        name: "AVANT.WeaponPropertyRune.pacifying.Name",
        price: 150,
        rarity: "uncommon",
        slug: "pacifying",
        traits: ["magical"],
    },
    returning: {
        attack: {
            notes: [
                { title: "AVANT.WeaponPropertyRune.returning.Name", text: "AVANT.WeaponPropertyRune.returning.Note" },
            ],
        },
        level: 3,
        name: "AVANT.WeaponPropertyRune.returning.Name",
        price: 55,
        rarity: "common",
        slug: "returning",
        traits: ["magical"],
    },
    rooting: {
        level: 7,
        name: "AVANT.WeaponPropertyRune.rooting.Name",
        price: 360,
        rarity: "common",
        slug: "rooting",
        traits: ["plant", "magical", "wood"],
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.rooting.Name",
                    text: "AVANT.WeaponPropertyRune.rooting.Note.criticalSuccess",
                },
            ],
        },
    },
    serrating: {
        damage: {
            additional: [{ damageType: "slashing", diceNumber: 1, dieSize: "d4" }],
        },
        level: 10,
        name: "AVANT.WeaponPropertyRune.serrating.Name",
        price: 1000,
        rarity: "uncommon",
        slug: "serrating",
        traits: ["magical"],
    },
    shifting: {
        level: 6,
        name: "AVANT.WeaponPropertyRune.shifting.Name",
        price: 225,
        rarity: "common",
        slug: "shifting",
        traits: ["magical"],
    },
    shock: {
        damage: {
            additional: [{ damageType: "electricity", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.shock.Name",
                    text: "AVANT.WeaponPropertyRune.shock.Note.criticalSuccess",
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.shock.Name",
        price: 500,
        rarity: "common",
        slug: "shock",
        traits: ["electricity", "magical"],
    },
    shockwave: {
        damage: {
            additional: [
                {
                    damageCategory: "splash",
                    damageType: "bludgeoning",
                    label: "AVANT.WeaponPropertyRune.shockwave.Name",
                    modifier: "@item.baseDamage.dice",
                    predicate: ["item:melee", "item:damage:type:bludgeoning"],
                },
            ],
            notes: [
                {
                    outcome: ["success", "criticalSuccess"],
                    predicate: ["item:melee", "item:damage:type:bludgeoning"],
                    title: "AVANT.WeaponPropertyRune.shockwave.Name",
                    text: "AVANT.WeaponPropertyRune.shockwave.Note",
                },
            ],
        },
        level: 13,
        name: "AVANT.WeaponPropertyRune.shockwave.Name",
        price: 3000,
        rarity: "common",
        slug: "shockwave",
        traits: ["electricity", "magical"],
    },
    speed: {
        level: 16,
        name: "AVANT.WeaponPropertyRune.speed.Name",
        price: 10_000,
        rarity: "rare",
        slug: "speed",
        traits: ["magical"],
    },
    spellStoring: {
        level: 13,
        name: "AVANT.WeaponPropertyRune.spellStoring.Name",
        price: 2700,
        rarity: "uncommon",
        slug: "spellStoring",
        traits: ["magical"],
    },
    swarming: {
        level: 9,
        name: "AVANT.WeaponPropertyRune.swarming.Name",
        price: 700,
        rarity: "common",
        slug: "swarming",
        traits: ["magical"],
    },
    thundering: {
        damage: {
            additional: [{ damageType: "sonic", diceNumber: 1, dieSize: "d6" }],
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.thundering.Name",
                    text: "AVANT.WeaponPropertyRune.thundering.Note.criticalSuccess",
                },
            ],
        },
        level: 8,
        name: "AVANT.WeaponPropertyRune.thundering.Name",
        price: 500,
        rarity: "common",
        slug: "thundering",
        traits: ["magical", "sonic"],
    },
    trueRooting: {
        level: 19,
        name: "AVANT.WeaponPropertyRune.trueRooting.Name",
        price: 40_000,
        rarity: "common",
        slug: "trueRooting",
        traits: ["plant", "magical", "wood"],
        damage: {
            notes: [
                {
                    outcome: ["criticalSuccess"],
                    title: "AVANT.WeaponPropertyRune.trueRooting.Name",
                    text: "AVANT.WeaponPropertyRune.trueRooting.Note.criticalSuccess",
                },
            ],
        },
    },
    underwater: {
        level: 3,
        name: "AVANT.WeaponPropertyRune.underwater.Name",
        price: 50,
        rarity: "common",
        slug: "underwater",
        traits: ["magical", "water"],
    },
    unholy: {
        level: 11,
        name: "AVANT.WeaponPropertyRune.unholy.Name",
        price: 1400,
        rarity: "common",
        slug: "unholy",
        traits: ["unholy", "magical"],
        damage: {
            additional: [
                {
                    damageType: "spirit",
                    diceNumber: 1,
                    dieSize: "d4",
                    predicate: [{ not: "target:trait:holy" }],
                },
                {
                    damageType: "spirit",
                    diceNumber: 2,
                    dieSize: "d4",
                    predicate: ["target:trait:holy"],
                },
            ],
        },
        strikeAdjustments: [
            {
                adjustTraits: (_weapon: WeaponAvant | MeleeAvant, traits: AbilityTrait[]): void => {
                    if (!traits.includes("unholy")) traits.push("unholy");
                },
            },
        ],
    },
    vorpal: {
        level: 17,
        name: "AVANT.WeaponPropertyRune.vorpal.Name",
        price: 15_000,
        rarity: "rare",
        slug: "vorpal",
        traits: ["magical"],
    },
    wounding: {
        damage: {
            additional: [{ damageType: "bleed", diceNumber: 1, dieSize: "d6" }],
        },
        level: 7,
        name: "AVANT.WeaponPropertyRune.wounding.Name",
        price: 340,
        rarity: "common",
        slug: "wounding",
        traits: ["magical"],
    },
};

const RUNE_DATA = {
    armor: { ...FUNDAMENTAL_ARMOR_RUNE_DATA, property: ARMOR_PROPERTY_RUNES },
    shield: FUNDAMENTAL_SHIELD_RUNE_DATA,
    weapon: { ...FUNDAMENTAL_WEAPON_RUNE_DATA, property: WEAPON_PROPERTY_RUNES },
};

export {
    RUNE_DATA,
    getPropertyRuneDamage,
    getPropertyRuneDegreeAdjustments,
    getPropertyRuneModifierAdjustments,
    getPropertyRuneSlots,
    getPropertyRuneStrikeAdjustments,
    getRuneValuationData,
    prunePropertyRunes,
};
export type { RuneData, WeaponPropertyRuneData };
