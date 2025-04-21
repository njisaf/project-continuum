import { ArmyAvant, CharacterAvant, FamiliarAvant, HazardAvant, LootAvant, NPCAvant, PartyAvant, VehicleAvant } from "@actor";
import { SenseAcuity } from "@actor/creature/types.ts";
import { LANGUAGES, SENSE_TYPES } from "@actor/creature/values.ts";
import type { ActorType, AttributeString, SkillSlug } from "@actor/types.ts";
import { MOVEMENT_TYPES } from "@actor/values.ts";
import {
    AbilityItemAvant,
    AfflictionAvant,
    AncestryAvant,
    ArmorAvant,
    BackgroundAvant,
    BookAvant,
    CampaignFeatureAvant,
    ClassAvant,
    ConditionAvant,
    ConsumableAvant,
    ContainerAvant,
    DeityAvant,
    EffectAvant,
    EquipmentAvant,
    FeatAvant,
    HeritageAvant,
    KitAvant,
    LoreAvant,
    MeleeAvant,
    ShieldAvant,
    SpellAvant,
    SpellcastingEntryAvant,
    TreasureAvant,
    WeaponAvant,
} from "@item";
import { ArmorCategory, ArmorGroup } from "@item/armor/types.ts";
import { ConditionSlug } from "@item/condition/types.ts";
import { CONSUMABLE_CATEGORIES } from "@item/consumable/values.ts";
import { DeityDomain } from "@item/deity/types.ts";
import { FeatOrFeatureCategory } from "@item/feat/index.ts";
import { PreciousMaterialGrade } from "@item/physical/types.ts";
import { MeleeWeaponGroup, WeaponCategory, WeaponGroup, WeaponReloadTime } from "@item/weapon/types.ts";
import { Size } from "@module/data.ts";
import { JournalSheetAvant } from "@module/journal-entry/sheet.ts";
import { configFromLocalization, sluggify } from "@util";
import * as R from "remeda";
import {
    damageCategories,
    damageRollFlavors,
    damageTypes,
    energyDamageTypes,
    materialDamageEffects,
    physicalDamageTypes,
} from "./damage.ts";
import { immunityTypes, resistanceTypes, weaknessTypes } from "./iwr.ts";
import {
    actionTraits,
    ancestryTraits,
    armorTraits,
    classTraits,
    consumableTraits,
    creatureTraits,
    damageTraits,
    effectTraits,
    elementTraits,
    equipmentTraits,
    featTraits,
    hazardTraits,
    kingmakerTraits,
    magicTraditions,
    npcAttackTraits,
    otherArmorTags,
    otherConsumableTags,
    otherWeaponTags,
    preciousMaterials,
    shieldTraits,
    spellTraits,
    traitDescriptions,
    vehicleTraits,
    weaponTraits,
} from "./traits.ts";

export type StatusEffectIconTheme = "default" | "blackWhite";

const actorTypes: Record<ActorType, string> = {
    army: "TYPES.Actor.army",
    character: "TYPES.Actor.character",
    familiar: "TYPES.Actor.familiar",
    hazard: "TYPES.Actor.hazard",
    loot: "TYPES.Actor.loot",
    npc: "TYPES.Actor.npc",
    party: "TYPES.Actor.party",
    vehicle: "TYPES.Actor.vehicle",
};

const abilities: Record<AttributeString, string> = {
    str: "AVANT.AbilityStr",
    dex: "AVANT.AbilityDex",
    con: "AVANT.AbilityCon",
    int: "AVANT.AbilityInt",
    wis: "AVANT.AbilityWis",
    cha: "AVANT.AbilityCha",
    mgt: "AVANT.AbilityMgt",
    gra: "AVANT.AbilityGra",
    intl: "AVANT.AbilityIntl",
    foc: "AVANT.AbilityFoc",
};

// Senses
const senses = R.mapToObj(Array.from(SENSE_TYPES), (t) => [
    t,
    `AVANT.Actor.Creature.Sense.Type.${sluggify(t, { camel: "bactrian" })}`,
]);

const senseAcuities: Record<SenseAcuity, string> = {
    imprecise: "AVANT.Actor.Creature.Sense.Acuity.Imprecise",
    precise: "AVANT.Actor.Creature.Sense.Acuity.Precise",
    vague: "AVANT.Actor.Creature.Sense.Acuity.Vague",
};

/** Non-detection- and attitude- related conditions added to the Token HUD */
const tokenHUDConditions = {
    blinded: "AVANT.ConditionTypeBlinded",
    broken: "AVANT.ConditionTypeBroken",
    clumsy: "AVANT.ConditionTypeClumsy",
    concealed: "AVANT.ConditionTypeConcealed",
    confused: "AVANT.ConditionTypeConfused",
    controlled: "AVANT.ConditionTypeControlled",
    dazzled: "AVANT.ConditionTypeDazzled",
    deafened: "AVANT.ConditionTypeDeafened",
    doomed: "AVANT.ConditionTypeDoomed",
    drained: "AVANT.ConditionTypeDrained",
    dying: "AVANT.ConditionTypeDying",
    encumbered: "AVANT.ConditionTypeEncumbered",
    enfeebled: "AVANT.ConditionTypeEnfeebled",
    fascinated: "AVANT.ConditionTypeFascinated",
    fatigued: "AVANT.ConditionTypeFatigued",
    fleeing: "AVANT.ConditionTypeFleeing",
    frightened: "AVANT.ConditionTypeFrightened",
    grabbed: "AVANT.ConditionTypeGrabbed",
    hidden: "AVANT.ConditionTypeHidden",
    immobilized: "AVANT.ConditionTypeImmobilized",
    invisible: "AVANT.ConditionTypeInvisible",
    "off-guard": "AVANT.ConditionTypeOffGuard",
    paralyzed: "AVANT.ConditionTypeParalyzed",
    "persistent-damage": "AVANT.ConditionTypePersistent",
    petrified: "AVANT.ConditionTypePetrified",
    prone: "AVANT.ConditionTypeProne",
    quickened: "AVANT.ConditionTypeQuickened",
    restrained: "AVANT.ConditionTypeRestrained",
    sickened: "AVANT.ConditionTypeSickened",
    slowed: "AVANT.ConditionTypeSlowed",
    stunned: "AVANT.ConditionTypeStunned",
    stupefied: "AVANT.ConditionTypeStupefied",
    unconscious: "AVANT.ConditionTypeUnconscious",
    undetected: "AVANT.ConditionTypeUndetected",
    wounded: "AVANT.ConditionTypeWounded",
};

const conditionTypes: Record<ConditionSlug, string> = {
    ...tokenHUDConditions,
    cursebound: "AVANT.ConditionTypeCursebound",
    friendly: "AVANT.ConditionTypeFriendly",
    helpful: "AVANT.ConditionTypeHelpful",
    hostile: "AVANT.ConditionTypeHostile",
    indifferent: "AVANT.ConditionTypeIndifferent",
    malevolence: "AVANT.ConditionTypeMalevolence",
    observed: "AVANT.ConditionTypeObserved",
    unfriendly: "AVANT.ConditionTypeUnfriendly",
    unnoticed: "AVANT.ConditionTypeUnnoticed",
};

const armorCategories: Record<ArmorCategory, string> = {
    unarmored: "AVANT.ArmorTypeUnarmored",
    light: "AVANT.ArmorTypeLight",
    medium: "AVANT.ArmorTypeMedium",
    heavy: "AVANT.ArmorTypeHeavy",
    "light-barding": "AVANT.Item.Armor.Category.light-barding",
    "heavy-barding": "AVANT.Item.Armor.Category.heavy-barding",
};

const armorGroups: Record<ArmorGroup, string> = {
    composite: "AVANT.ArmorGroupComposite",
    chain: "AVANT.ArmorGroupChain",
    cloth: "AVANT.ArmorGroupCloth",
    leather: "AVANT.ArmorGroupLeather",
    plate: "AVANT.ArmorGroupPlate",
    skeletal: "AVANT.ArmorGroupSkeletal",
    wood: "AVANT.ArmorGroupWood",
};

const weaponCategories: Record<WeaponCategory, string> = {
    simple: "AVANT.WeaponTypeSimple",
    martial: "AVANT.WeaponTypeMartial",
    advanced: "AVANT.WeaponTypeAdvanced",
    unarmed: "AVANT.WeaponTypeUnarmed",
};

const baseArmorTypes = R.mapValues(EN_JSON.AVANT.Item.Armor.Base, (_v, slug) => `AVANT.Item.Armor.Base.${slug}`);
const baseShieldTypes = R.mapValues(EN_JSON.AVANT.Item.Shield.Base, (_v, slug) => `AVANT.Item.Shield.Base.${slug}`);
const baseWeaponTypes = R.mapValues(EN_JSON.AVANT.Weapon.Base, (_v, slug) => `AVANT.Weapon.Base.${slug}`);

/** Base weapon types that are considered equivalent for all rules purposes */
const equivalentWeapons = {
    "composite-longbow": "longbow",
    "composite-shortbow": "shortbow",
    "big-boom-gun": "hand-cannon",
    "spoon-gun": "hand-cannon",
} as const;

const preciousMaterialGrades: Record<PreciousMaterialGrade, string> = {
    low: "AVANT.PreciousMaterialLowGrade",
    standard: "AVANT.PreciousMaterialStandardGrade",
    high: "AVANT.PreciousMaterialHighGrade",
};

const meleeWeaponGroups: Record<MeleeWeaponGroup, string> = {
    axe: "AVANT.WeaponGroupAxe",
    brawling: "AVANT.WeaponGroupBrawling",
    club: "AVANT.WeaponGroupClub",
    dart: "AVANT.WeaponGroupDart",
    flail: "AVANT.WeaponGroupFlail",
    hammer: "AVANT.WeaponGroupHammer",
    knife: "AVANT.WeaponGroupKnife",
    pick: "AVANT.WeaponGroupPick",
    polearm: "AVANT.WeaponGroupPolearm",
    shield: "AVANT.WeaponGroupShield",
    spear: "AVANT.WeaponGroupSpear",
    sword: "AVANT.WeaponGroupSword",
};

const weaponGroups: Record<WeaponGroup, string> = {
    ...meleeWeaponGroups,
    bomb: "AVANT.WeaponGroupBomb",
    bow: "AVANT.WeaponGroupBow",
    crossbow: "AVANT.WeaponGroupCrossbow",
    firearm: "AVANT.WeaponGroupFirearm",
    sling: "AVANT.WeaponGroupSling",
};

// Creature and Equipment Sizes
const sizeTypes: Record<Size, string> = {
    tiny: "AVANT.ActorSizeTiny",
    sm: "AVANT.ActorSizeSmall",
    med: "AVANT.ActorSizeMedium",
    lg: "AVANT.ActorSizeLarge",
    huge: "AVANT.ActorSizeHuge",
    grg: "AVANT.ActorSizeGargantuan",
};

const speedTypes = R.mapToObj(MOVEMENT_TYPES, (t) => [
    t,
    `AVANT.Actor.Speed.Type.${sluggify(t, { camel: "bactrian" })}`,
]);

const featCategories: Record<FeatOrFeatureCategory, string> = {
    ancestry: "AVANT.Item.Feat.Category.Ancestry",
    ancestryfeature: "AVANT.Item.Feat.Category.AncestryFeature",
    calling: "AVANT.Item.Feat.Category.Calling",
    class: "AVANT.Item.Feat.Category.Class",
    classfeature: "AVANT.Item.Feat.Category.ClassFeature",
    skill: "AVANT.Item.Feat.Category.Skill",
    general: "AVANT.Item.Feat.Category.General",
    bonus: "AVANT.Item.Feat.Category.Bonus",
    pfsboon: "AVANT.Item.Feat.Category.PfsBoon",
    deityboon: "AVANT.Item.Feat.Category.DeityBoon",
    curse: "AVANT.Item.Feat.Category.Curse",
};

const creatureTypes = R.pick(creatureTraits, [
    "aberration",
    "animal",
    "astral",
    "beast",
    "celestial",
    "construct",
    "dragon",
    "dream",
    "elemental",
    "ethereal",
    "fey",
    "fiend",
    "fungus",
    "giant",
    "humanoid",
    "monitor",
    "ooze",
    "petitioner",
    "plant",
    "shadow",
    "spirit",
    "time",
    "vitality",
    "void",
    "undead",
]);

const consumableCategories = R.mapToObj(Array.from(CONSUMABLE_CATEGORIES), (c) => [
    c,
    `AVANT.Item.Consumable.Category.${c}`,
]);

const deityDomains = R.mapToObj(Object.keys(EN_JSON.AVANT.Item.Deity.Domain), (key) => {
    const label = `AVANT.Item.Deity.Domain.${key}.Label`;
    const description = `AVANT.Item.Deity.Domain.${key}.Description`;
    return [sluggify(key) as DeityDomain, { label, description }];
});

const weaponReload: Record<WeaponReloadTime, string> = {
    "-": "—", // Reload value for thrown weapons
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    10: "AVANT.Item.Weapon.Reload.OneMinute",
};

export const AVANTCONFIG = {
    defaultPartyId: "AvantParty000001",
    chatDamageButtonShieldToggle: false,

    statusEffects: {
        lastIconTheme: "default" as StatusEffectIconTheme,
        iconDir: "systems/avant/icons/conditions/",
        conditions: tokenHUDConditions,
    },

    levels: {
        1: "AVANT.Level1",
        2: "AVANT.Level2",
        3: "AVANT.Level3",
        4: "AVANT.Level4",
        5: "AVANT.Level5",
        6: "AVANT.Level6",
        7: "AVANT.Level7",
        8: "AVANT.Level8",
        9: "AVANT.Level9",
        10: "AVANT.Level10",
        11: "AVANT.Level11",
        12: "AVANT.Level12",
        13: "AVANT.Level13",
        14: "AVANT.Level14",
        15: "AVANT.Level15",
        16: "AVANT.Level16",
        17: "AVANT.Level17",
        18: "AVANT.Level18",
        19: "AVANT.Level19",
        20: "AVANT.Level20",
    },

    abilities,

    dcAdjustments: {
        "incredibly-easy": "AVANT.DCAdjustmentIncrediblyEasy",
        "very-easy": "AVANT.DCAdjustmentVeryEasy",
        easy: "AVANT.DCAdjustmentEasy",
        normal: "AVANT.DCAdjustmentNormal",
        hard: "AVANT.DCAdjustmentHard",
        "very-hard": "AVANT.DCAdjustmentVeryHard",
        "incredibly-hard": "AVANT.DCAdjustmentIncrediblyHard",
    },

    checkDCs: configFromLocalization(EN_JSON.AVANT.Check.DC, "AVANT.Check.DC"),

    saves: {
        fortitude: "AVANT.SavesFortitude",
        reflex: "AVANT.SavesReflex",
        will: "AVANT.SavesWill",
    },

    savingThrowDefaultAttributes: {
        fortitude: "con",
        reflex: "dex",
        will: "wis",
    } as const,

    currencies: {
        pp: "AVANT.CurrencyPP",
        gp: "AVANT.CurrencyGP",
        sp: "AVANT.CurrencySP",
        cp: "AVANT.CurrencyCP",
    },

    preciousMaterialGrades,
    preciousMaterials,

    accessoryPropertyRunes: {
        called: "AVANT.AccessoryPropertyRuneCalled",
        dragonsBreath: "AVANT.AccessoryPropertyRuneDragonsBreath",
        paired: "AVANT.AccessoryPropertyRunePaired",
        greaterPaired: "AVANT.AccessoryPropertyRuneGreaterPaired",
        majorPaired: "AVANT.AccessoryPropertyRuneMajorPaired",
        presentable: "AVANT.AccessoryPropertyRunePresentable",
        snagging: "AVANT.AccessoryPropertyRuneSnagging",
        softLanding: "AVANT.AccessoryPropertyRuneSoftLanding",
        spellBastion: "AVANT.AccessoryPropertyRuneSpellBastion",
        windCatcher: "AVANT.AccessoryPropertyRuneWindCatcher",
        greaterWindCatcher: "AVANT.AccessoryPropertyRuneGreaterWindCatcher",
    },
    damageTraits,
    damageTypes,
    damageRollFlavors,
    damageCategories,
    energyDamageTypes,
    materialDamageEffects,
    physicalDamageTypes,
    resistanceTypes,

    stackGroups: {
        arrows: "AVANT.StackGroupArrows",
        blowgunDarts: "AVANT.StackGroupBlowgunDarts",
        bolts: "AVANT.StackGroupBolts",
        coins: "AVANT.StackGroupCoins",
        gems: "AVANT.StackGroupGems",
        rounds5: "AVANT.StackGroupRounds5",
        rounds10: "AVANT.StackGroupRounds10",
        slingBullets: "AVANT.StackGroupSlingBullets",
        sprayPellets: "AVANT.StackGroupSprayPellets",
        woodenTaws: "AVANT.StackGroupWoodenTaws",
    },

    weaknessTypes,
    weaponCategories,
    weaponGroups,

    meleeWeaponGroups,

    baseArmorTypes,
    baseShieldTypes,
    baseWeaponTypes,
    equivalentWeapons,

    weaponDescriptions: {
        club: "AVANT.WeaponDescriptionClub",
        knife: "AVANT.WeaponDescriptionKnife",
        brawling: "AVANT.WeaponDescriptionBrawling",
        spear: "AVANT.WeaponDescriptionSpear",
        sword: "AVANT.WeaponDescriptionSword",
        axe: "AVANT.WeaponDescriptionAxe",
        flail: "AVANT.WeaponDescriptionFlail",
        polearm: "AVANT.WeaponDescriptionPolearm",
        pick: "AVANT.WeaponDescriptionPick",
        hammer: "AVANT.WeaponDescriptionHammer",
        shield: "AVANT.WeaponDescriptionShield",
        dart: "AVANT.WeaponDescriptionDart",
        bow: "AVANT.WeaponDescriptionBow",
        sling: "AVANT.WeaponDescriptionSling",
        bomb: "AVANT.WeaponDescriptionBomb",
    },

    usages: {
        "affixed-to-a-creature": "AVANT.TraitAffixedToCreature",
        "affixed-to-a-magical-staff": "AVANT.TraitAffixedToMagicalStaff",
        "affixed-to-a-metal-weapon": "AVANT.TraitAffixedToAMetalWeapon",
        "affixed-to-a-one-handed-firearm-or-hand-crossbow": "AVANT.TraitAffixedToAOneHandedFirearmOrHandCrossbow",
        "affixed-to-a-ranged-weapon": "AVANT.TraitAffixedToARangedWeapon",
        "affixed-to-a-shield": "AVANT.TraitAffixedToAShield",
        "affixed-to-a-shield-or-weapon": "AVANT.TraitAffixedToAShieldOrWeapon",
        "affixed-to-a-thrown-weapon": "AVANT.TraitAffixedToThrownWeapon",
        "affixed-to-a-two-handed-firearm-or-crossbow": "AVANT.TraitAffixedToATwoHandedFirearmOrCrossbow",
        "affixed-to-an-innovation": "AVANT.TraitAffixedToInnovation",
        "affixed-to-an-object-or-structure": "AVANT.TraitAffixedToObjectOrStructure",
        "affixed-to-armor": "AVANT.TraitAffixedToArmor",
        "affixed-to-medium-heavy-armor": "AVANT.TraitAffixedToMediumHeavyArmor",
        "affixed-to-medium-heavy-metal-armor": "AVANT.TraitAffixedToMediumHeavyMetalArmor",
        "affixed-to-metal-armor-or-a-weapon": "AVANT.TraitAffixedToMetalArmorOrAWeapon",
        "affixed-to-non-metal-armor-or-a-weapon": "AVANT.TraitAffixedToNMArmorOrAWeapon",
        "affixed-to-armor-shield-or-weapon": "AVANT.TraitAffixedToArmorShieldOrWeapon",
        "affixed-to-armor-or-a-weapon": "AVANT.TraitAffixedToArmorOrAWeapon",
        "affixed-to-armor-or-travelers-clothing": "AVANT.TraitAffixedToArmorOrTravelersClothing",
        "affixed-to-crossbow-or-firearm": "AVANT.TraitAffixedToCrossbowOrFirearm",
        "affixed-to-firearm": "AVANT.TraitAffixedToFirearm",
        "affixed-to-firearm-with-a-reload-of-1": "AVANT.TraitAffixedToFirearmWithAReloadOf1",
        "affixed-to-firearm-with-the-kickback-trait": "AVANT.TraitAffixedToFirearmWithTheKickbackTrait",
        "affixed-to-ground-in-10-foot-radius": "AVANT.TraitAffixedToGroundIn10FtRadius",
        "affixed-to-ground-in-20-foot-radius": "AVANT.TraitAffixedToGroundIn20FtRadius",
        "affixed-to-harness": "AVANT.TraitAffixedToHarness",
        "affixed-to-headgear": "AVANT.TraitAffixedToHeadgear",
        "affixed-to-instrument": "AVANT.TraitAffixedToInstrument",
        "affixed-to-load-bearing-wall-or-pillar": "AVANT.TraitAffixedToLoadBearingWallOrPillar",
        "affixed-to-melee-weapon": "AVANT.TraitAffixedToMeleeWeapon",
        "affixed-to-metal-weapon": "AVANT.TraitAffixedToMetalWeapon",
        "affixed-to-object-structure-or-creature": "AVANT.TraitAffixedToStructureObjectOrCreature",
        "affixed-to-the-ground": "AVANT.TraitAffixedToGround",
        "affixed-to-unarmored-defense-item": "AVANT.TraitAffixedToUnarmoredItem",
        "affixed-to-wall": "AVANT.TraitAffixedToWall",
        "affixed-to-weapon": "AVANT.TraitAffixedToWeapon",
        "applied-to-a-basket-bag-or-other-container": "AVANT.TraitAppliedToBasketBagOrContainer",
        "applied-to-a-weapon": "AVANT.TraitAppliedToAWeapon",
        "applied-to-a-wind-powered-vehicle": "AVANT.TraitAppliedToAWindPoweredVehicle",
        "applied-to-a-non-injection-melee-weapon-piercing-damage":
            "AVANT.TraitAppliedToANoninjectionMeleePiercingWeapon",
        "applied-to-any-item-of-light-or-negligible-bulk": "AVANT.TraitAppliedToAnyItemOfLightOrNegligibleBulk",
        "applied-to-any-visible-article-of-clothing": "AVANT.TraitAppliedToAnyVisibleArticleOfClothing",
        "applied-to-armor": "AVANT.TraitAppliedToArmor",
        "applied-to-armor-or-unarmored-defense-clothing": "AVANT.TraitAppliedToArmorOrUnarmored",
        "applied-to-belt-cape-cloak-or-scarf": "AVANT.TraitAppliedToBeltCapeCloakOrScarf",
        "applied-to-boots-cape-cloak-or-umbrella": "AVANT.TraitAppliedToBootsCapeCloakOrUmbrella",
        "applied-to-buckler-shield": "AVANT.TraitAppliedToBucklerShield",
        "applied-to-dueling-cape-or-shield": "AVANT.TraitAppliedToDuelingCapeOrShield",
        "applied-to-footwear": "AVANT.TraitAppliedToFootwear",
        "applied-to-medium-heavy-armor": "AVANT.TraitAppliedToMediumHeavyArmor",
        "applied-to-shield": "AVANT.TraitAppliedToShield",
        "attached-to-a-thrown-weapon": "AVANT.TraitAttachedToAThrownWeapon",
        "attached-to-crossbow-or-firearm": "AVANT.TraitAttachedToCrossbowOrFirearm",
        "attached-to-crossbow-or-firearm-firing-mechanism": "AVANT.TraitAttachedToCrossbowOrFirearmFiringMechanism",
        "attached-to-crossbow-or-firearm-scope": "AVANT.TraitAttachedToCrossbowOrFirearmScope",
        "attached-to-firearm": "AVANT.TraitAttachedToFirearm",
        "attached-to-firearm-scope": "AVANT.TraitAttachedToFirearmScope",
        "attached-to-melee-weapon": "AVANT.TraitAttachedToMeleeWeapon",
        "attached-to-ships-bow": "AVANT.TraitAttachedToShipsBow",
        bonded: "AVANT.TraitBonded",
        carried: "AVANT.TraitCarried",
        "each-rune-applied-to-a-separate-item-that-has-pockets":
            "AVANT.TraitEachRuneAppliedToASeparateItemThatHasPockets",
        "etched-onto-a-weapon": "AVANT.TraitEtchedOntoAWeapon",
        "etched-onto-a-shield": "AVANT.TraitEtchedOntoAShield",
        "etched-onto-armor": "AVANT.TraitEtchedOntoArmor",
        "etched-onto-heavy-armor": "AVANT.TraitEtchedOntoHeavyArmor",
        "etched-onto-light-armor": "AVANT.TraitEtchedOntoLightArmor",
        "etched-onto-metal-armor": "AVANT.TraitEtchedOntoMetalArmor",
        "etched-onto-clan-dagger": "AVANT.TraitEtchedOntoAClanDagger",
        "etched-onto-lm-nonmetal-armor": "AVANT.TraitEtchedOntoLightMedNMArmor",
        "etched-onto-med-heavy-armor": "AVANT.TraitEtchedOntoMedHeavyArmor",
        "etched-onto-medium-heavy-metal-armor": "AVANT.TraitEtchedOntoMediumHeavyMetalArmor",
        "etched-onto-bludgeoning-weapon": "AVANT.TraitEtchedOntoABludgeoningWeapon",
        "etched-onto-melee-weapon": "AVANT.TraitEtchedOntoAMeleeWeapon",
        "etched-onto-slashing-melee-weapon": "AVANT.TraitEtchedOntoASlashingMeleeWeapon",
        "etched-onto-piercing-or-slashing-melee-weapon": "AVANT.TraitEtchedOntoAPiercingOrSlashingMeleeWeapon",
        "etched-onto-piercing-or-slashing-weapon": "AVANT.TraitEtchedOntoAPiercingOrSlashingWeapon",
        "etched-onto-weapon-wo-anarchic-rune": "AVANT.TraitEtchedOntoAWeaponWOAxiomaticRune",
        "etched-onto-weapon-wo-axiomatic-rune": "AVANT.TraitEtchedOntoAWeaponWOAnarchicRune",
        "etched-onto-weapon-wo-unholy-rune": "AVANT.TraitEtchedOntoAWeaponWOHolyRune",
        "etched-onto-weapon-wo-holy-rune": "AVANT.TraitEtchedOntoAWeaponWOUnholyRune",
        "etched-onto-melee-weapon-monk": "AVANT.TraitEtchedOntoAMeleeWeaponMonk",
        "etched-onto-thrown-weapon": "AVANT.TraitEtchedOntoAThrownWeapon",
        "held-in-one-hand": "AVANT.TraitHeldOneHand",
        "held-in-one-hand-or-free-standing": "AVANT.TraitHeldOneHandFreeStanding",
        "held-in-1-hand-hung-on-a-cord-or-attached-to-clothing": "AVANT.HeldInOneHandHungOnACordOrAttachedToClothing",
        "held-in-one-or-two-hands": "AVANT.TraitHeldOneTwoHands",
        "held-in-two-hands": "AVANT.TraitHeldTwoHands",
        implanted: "AVANT.TraitImplanted",
        "mounted-on-a-tripod-or-bracket": "AVANT.TraitMountedOnATripodOrBracket",
        other: "AVANT.TraitOther",
        "sewn-into-clothing": "AVANT.TraitSewnIntoClothing",
        "tattooed-on-the-body": "AVANT.TraitTattooedOnTheBody",
        touched: "AVANT.TraitTouched",
        worn: "AVANT.TraitWorn",
        wornamulet: "AVANT.TraitWornAmulet",
        wornanklets: "AVANT.TraitWornAnklets",
        wornarmbands: "AVANT.TraitWornArmbands",
        wornbackpack: "AVANT.TraitWornBackpack",
        wornbarding: "AVANT.TraitWornBarding",
        wornbelt: "AVANT.TraitWornBelt",
        wornbeltpouch: "AVANT.TraitWornBeltPouch",
        wornboots: "AVANT.TraitWornBoots",
        wornbracelet: "AVANT.TraitWornBracelet",
        wornbracers: "AVANT.TraitWornBracers",
        worncap: "AVANT.TraitWornCap",
        worncape: "AVANT.TraitWornCape",
        worncirclet: "AVANT.TraitWornCirclet",
        worncloak: "AVANT.TraitWornCloak",
        wornclothing: "AVANT.TraitWornClothing",
        worncollar: "AVANT.TraitWornCollar",
        worncrown: "AVANT.TraitWornCrown",
        wornepaulet: "AVANT.TraitWornEpaulet",
        worneyeglasses: "AVANT.TraitWornEyeglasses",
        worneyepiece: "AVANT.TraitWornEyepiece",
        wornfootwear: "AVANT.TraitWornFootwear",
        worngarment: "AVANT.TraitWornGarment",
        worngloves: "AVANT.TraitWornGloves",
        wornheadwear: "AVANT.TraitWornHeadwear",
        wornhorseshoes: "AVANT.TraitWornHorseshoes",
        wornmask: "AVANT.TraitWornMask",
        wornnecklace: "AVANT.TraitWornNecklace",
        wornonbelt: "AVANT.TraitWornOnBelt",
        wornoronehand: "AVANT.TraitWornOrOneHand",
        wornring: "AVANT.TraitWornRing",
        wornsaddle: "AVANT.TraitWornSaddle",
        wornsandles: "AVANT.TraitWornSandles",
        wornshoes: "AVANT.TraitWornShoes",
        wornwrist: "AVANT.TraitWornOnWrists",
        "worn-and-attached-to-two-weapons": "AVANT.TraitWornAndAttachedToTwoWeapons",
        "worn-under-armor": "AVANT.TraitWornUnderArmor",
    },

    magicTraditions,
    deityDomains,

    otherArmorTags,
    otherConsumableTags,
    otherWeaponTags,

    actionTraits,
    ancestryTraits,
    armorTraits,
    classTraits,
    consumableTraits,
    creatureTraits,
    effectTraits,
    elementTraits,
    equipmentTraits,
    featTraits,
    hazardTraits,
    kingmakerTraits,
    npcAttackTraits,
    shieldTraits,
    spellTraits,
    vehicleTraits,
    weaponTraits,

    rarityTraits: {
        common: "AVANT.TraitCommon",
        uncommon: "AVANT.TraitUncommon",
        rare: "AVANT.TraitRare",
        unique: "AVANT.TraitUnique",
    },

    traitsDescriptions: traitDescriptions,

    creatureTypes,

    weaponHands: {
        1: "AVANT.WeaponHands1",
        "1+": "AVANT.WeaponHands1Plus",
        2: "AVANT.WeaponHands2",
    },

    itemBonuses: {
        "-2": "AVANT.ItemBonusMinus2",
        0: "AVANT.ItemBonus0",
        1: "AVANT.ItemBonus1",
        2: "AVANT.ItemBonus2",
        3: "AVANT.ItemBonus3",
    },

    damageDice: {
        0: "0",
        1: "1",
        2: "2",
        3: "3",
        4: "4",
    },

    damageDie: {
        d4: "AVANT.DamageDieD4",
        d6: "AVANT.DamageDieD6",
        d8: "AVANT.DamageDieD8",
        d10: "AVANT.DamageDieD10",
        d12: "AVANT.DamageDieD12",
    },

    weaponMAP: {
        1: "-1/-2",
        2: "-2/-4",
        3: "-3/-6",
        4: "-4/-8",
        5: "-5/-10",
    },

    weaponReload,
    armorCategories,
    armorGroups,
    consumableCategories,
    identification: configFromLocalization(EN_JSON.AVANT.identification, "AVANT.identification"),

    preparationType: {
        prepared: "AVANT.PreparationTypePrepared",
        spontaneous: "AVANT.PreparationTypeSpontaneous",
        innate: "AVANT.PreparationTypeInnate",
        focus: "AVANT.TraitFocus",
        items: "AVANT.PreparationTypeItems",
        ritual: "AVANT.Item.Spell.Ritual.Label",
    },

    attitude: {
        hostile: "AVANT.Attitudes.Hostile",
        unfriendly: "AVANT.Attitudes.Unfriendly",
        indifferent: "AVANT.Attitudes.Indifferent",
        friendly: "AVANT.Attitudes.Friendly",
        helpful: "AVANT.Attitudes.Helpful",
    },

    skills: Object.freeze({
        acrobatics: { label: "AVANT.Skill.Acrobatics", attribute: "dex" },
        arcana: { label: "AVANT.Skill.Arcana", attribute: "int" },
        athletics: { label: "AVANT.Skill.Athletics", attribute: "str" },
        crafting: { label: "AVANT.Skill.Crafting", attribute: "int" },
        deception: { label: "AVANT.Skill.Deception", attribute: "cha" },
        diplomacy: { label: "AVANT.Skill.Diplomacy", attribute: "cha" },
        intimidation: { label: "AVANT.Skill.Intimidation", attribute: "cha" },
        medicine: { label: "AVANT.Skill.Medicine", attribute: "wis" },
        nature: { label: "AVANT.Skill.Nature", attribute: "wis" },
        occultism: { label: "AVANT.Skill.Occultism", attribute: "int" },
        performance: { label: "AVANT.Skill.Performance", attribute: "cha" },
        religion: { label: "AVANT.Skill.Religion", attribute: "wis" },
        society: { label: "AVANT.Skill.Society", attribute: "int" },
        stealth: { label: "AVANT.Skill.Stealth", attribute: "dex" },
        survival: { label: "AVANT.Skill.Survival", attribute: "wis" },
        thievery: { label: "AVANT.Skill.Thievery", attribute: "dex" },
        command: { label: "AVANT.Skill.Command", attribute: "mgt" },
        force: { label: "AVANT.Skill.Force", attribute: "mgt" },
        surge: { label: "AVANT.Skill.Surge", attribute: "mgt" },
        charm: { label: "AVANT.Skill.Charm", attribute: "gra" },
        finesse: { label: "AVANT.Skill.Finesse", attribute: "gra" },
        hide: { label: "AVANT.Skill.Hide", attribute: "gra" },
        debate: { label: "AVANT.Skill.Debate", attribute: "intl" },
        inspect: { label: "AVANT.Skill.Inspect", attribute: "intl" },
        recall: { label: "AVANT.Skill.Recall", attribute: "intl" },
        discern: { label: "AVANT.Skill.Discern", attribute: "foc" },
        endure: { label: "AVANT.Skill.Endure", attribute: "foc" },
        intuit: { label: "AVANT.Skill.Intuit", attribute: "foc" },
    }) satisfies Record<SkillSlug, { label: string; attribute: AttributeString }>,

    featCategories,

    actionTypes: {
        action: "AVANT.ActionTypeAction",
        reaction: "AVANT.ActionTypeReaction",
        free: "AVANT.ActionTypeFree",
        passive: "AVANT.ActionTypePassive",
    },

    actionsNumber: {
        1: "AVANT.ActionNumber1",
        2: "AVANT.ActionNumber2",
        3: "AVANT.ActionNumber3",
    },

    actionCategories: {
        interaction: "AVANT.Item.Ability.Category.Interaction",
        defensive: "AVANT.Item.Ability.Category.Defensive",
        offensive: "AVANT.Item.Ability.Category.Offensive",
        familiar: "AVANT.Item.Ability.Category.Familiar",
    },

    frequencies: {
        turn: "AVANT.Duration.turn",
        round: "AVANT.Duration.round",
        PT1M: "AVANT.Duration.PT1M",
        PT10M: "AVANT.Duration.PT10M",
        PT1H: "AVANT.Duration.PT1H",
        PT24H: "AVANT.Duration.PT24H",
        day: "AVANT.Duration.day",
        P1W: "AVANT.Duration.P1W",
        P1M: "AVANT.Duration.P1M",
        P1Y: "AVANT.Duration.P1Y",
    },

    timeUnits: {
        rounds: "AVANT.Time.Unit.Rounds",
        minutes: "AVANT.Time.Unit.Minutes",
        hours: "AVANT.Time.Unit.Hours",
        days: "AVANT.Time.Unit.Days",
        unlimited: "AVANT.Time.Unit.Unlimited",
        encounter: "AVANT.Time.Unit.UntilEncounterEnds",
    },

    // Proficiency Multipliers
    proficiencyLevels: [
        "AVANT.ProficiencyLevel0", // untrained
        "AVANT.ProficiencyLevel1", // trained
        "AVANT.ProficiencyLevel2", // expert
        "AVANT.ProficiencyLevel3", // master
        "AVANT.ProficiencyLevel4", // legendary
    ] as const,

    proficiencyRanks: {
        untrained: "AVANT.ProficiencyLevel0",
        trained: "AVANT.ProficiencyLevel1",
        expert: "AVANT.ProficiencyLevel2",
        master: "AVANT.ProficiencyLevel3",
        legendary: "AVANT.ProficiencyLevel4",
    } as const,

    actorSizes: sizeTypes,

    actorTypes,

    speedTypes,

    prerequisitePlaceholders: {
        prerequisite1: "AVANT.Prerequisite1",
        prerequisite2: "AVANT.Prerequisite2",
        prerequisite3: "AVANT.Prerequisite3",
        prerequisite4: "AVANT.Prerequisite4",
        prerequisite5: "AVANT.Prerequisite5",
    },

    senses,

    senseAcuities,

    conditionTypes,

    pfsFactions: {
        EA: "AVANT.PFS.Factions.EA",
        GA: "AVANT.PFS.Factions.GA",
        HH: "AVANT.PFS.Factions.HH",
        VS: "AVANT.PFS.Factions.VS",
        RO: "AVANT.PFS.Factions.RO",
        VW: "AVANT.PFS.Factions.VW",
    },

    pfsSchools: {
        none: "AVANT.PFS.School.None",
        scrolls: "AVANT.PFS.School.Scrolls",
        spells: "AVANT.PFS.School.Spells",
        swords: "AVANT.PFS.School.Swords",
    },

    immunityTypes,

    languages: R.mapToObj(LANGUAGES, (l) => [l, `AVANT.Actor.Creature.Language.${l}`]),

    attackEffects: {
        grab: "AVANT.AttackEffectGrab",
        "improved-grab": "AVANT.AttackEffectImprovedGrab",
        constrict: "AVANT.AttackEffectConstrict",
        "greater-constrict": "AVANT.AttackEffectGreaterConstrict",
        knockdown: "AVANT.AttackEffectKnockdown",
        "improved-knockdown": "AVANT.AttackEffectImprovedKnockdown",
        push: "AVANT.AttackEffectPush",
        "improved-push": "AVANT.AttackEffectImprovedPush",
        trip: "AVANT.AttackEffectTrip",
    },

    // Year offsets relative to the current actual year
    worldClock: fu.mergeObject(configFromLocalization(EN_JSON.AVANT.WorldClock, "AVANT.WorldClock"), {
        AR: { yearOffset: 2700 },
        IC: { yearOffset: 5200 },
        AD: { yearOffset: -95 },
        CE: { yearOffset: 0 },
    }),

    /** Max speed for number of hexploration activities */
    hexplorationActivities: {
        10: 0.5,
        25: 1,
        40: 2,
        55: 3,
        Infinity: 4,
    },

    environmentFeatures: {
        crowd: "AVANT.Environment.Feature.Crowd",
        ice: "AVANT.Environment.Feature.Ice",
        lava: "AVANT.Environment.Feature.Lava",
        rubble: "AVANT.Environment.Feature.Rubble",
        sand: "AVANT.Environment.Feature.Sand",
        sewer: "AVANT.Environment.Feature.Sewer",
        snow: "AVANT.Environment.Feature.Snow",
    },

    environmentTypes: {
        aquatic: "AVANT.Environment.Type.Aquatic",
        arctic: "AVANT.Environment.Type.Arctic",
        desert: "AVANT.Environment.Type.Desert",
        forest: "AVANT.Environment.Type.Forest",
        mountain: "AVANT.Environment.Type.Mountain",
        plains: "AVANT.Environment.Type.Plains",
        swamp: "AVANT.Environment.Type.Swamp",
        underground: "AVANT.Environment.Type.Underground",
        urban: "AVANT.Environment.Type.Urban",
    },

    SETTINGS: {
        automation: {
            rulesBasedVision: {
                name: "AVANT.SETTINGS.Automation.RulesBasedVision.Name",
                hint: "AVANT.SETTINGS.Automation.RulesBasedVision.Hint",
            },
            iwr: {
                name: "AVANT.SETTINGS.Automation.IWR.Name",
                hint: "AVANT.SETTINGS.Automation.IWR.Hint",
            },
            effectExpiration: {
                name: "AVANT.SETTINGS.Automation.EffectExpiration.Name",
                hint: "AVANT.SETTINGS.Automation.EffectExpiration.Hint",
            },
            removeExpiredEffects: {
                name: "AVANT.SETTINGS.Automation.RemoveExpiredEffects.Name",
                hint: "AVANT.SETTINGS.Automation.RemoveExpiredEffects.Hint",
            },
            flankingDetection: {
                name: "AVANT.SETTINGS.Automation.FlankingDetection.Name",
                hint: "AVANT.SETTINGS.Automation.FlankingDetection.Hint",
            },
            actorsDeadAtZero: {
                name: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Name",
                hint: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Hint",
                neither: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Neither",
                npcsOnly: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.NPCsOnly",
                both: "AVANT.SETTINGS.Automation.ActorsDeadAtZero.Both",
            },
            lootableNPCs: {
                name: "AVANT.SETTINGS.Automation.LootableNPCs.Name",
                hint: "AVANT.SETTINGS.Automation.LootableNPCs.Hint",
            },
        },
        worldClock: {
            name: "AVANT.SETTINGS.WorldClock.Name",
            label: "AVANT.SETTINGS.WorldClock.Label",
            hint: "AVANT.SETTINGS.WorldClock.Hint",
            dateTheme: {
                name: "AVANT.SETTINGS.WorldClock.DateTheme.Name",
                hint: "AVANT.SETTINGS.WorldClock.DateTheme.Hint",
                AR: "AVANT.SETTINGS.WorldClock.DateTheme.AR",
                IC: "AVANT.SETTINGS.WorldClock.DateTheme.IC",
                AD: "AVANT.SETTINGS.WorldClock.DateTheme.AD",
                CE: "AVANT.SETTINGS.WorldClock.DateTheme.CE",
            },
            timeConvention: {
                name: "AVANT.SETTINGS.WorldClock.TimeConvention.Name",
                hint: "AVANT.SETTINGS.WorldClock.TimeConvention.Hint",
                twentyFour: "AVANT.SETTINGS.WorldClock.TimeConvention.TwentyFour",
                twelve: "AVANT.SETTINGS.WorldClock.TimeConvention.Twelve",
            },
            showClockButton: {
                name: "AVANT.SETTINGS.WorldClock.ShowClockButton.Name",
                hint: "AVANT.SETTINGS.WorldClock.ShowClockButton.Hint",
            },
            playersCanView: {
                name: "AVANT.SETTINGS.WorldClock.PlayersCanView.Name",
                hint: "AVANT.SETTINGS.WorldClock.PlayersCanView.Hint",
            },
            syncDarkness: {
                name: "AVANT.SETTINGS.WorldClock.SyncDarkness.Name",
                hint: "AVANT.SETTINGS.WorldClock.SyncDarkness.Hint",
            },
            syncDarknessScene: {
                name: "AVANT.SETTINGS.WorldClock.SyncDarknessScene.Name",
                hint: "AVANT.SETTINGS.WorldClock.SyncDarknessScene.Hint",
                enabled: "AVANT.SETTINGS.EnabledDisabled.Enabled",
                default: "AVANT.SETTINGS.EnabledDisabled.Default",
                disabled: "AVANT.SETTINGS.EnabledDisabled.Disabled",
            },
            worldCreatedOn: {
                name: "AVANT.SETTINGS.WorldClock.WorldCreatedOn.Name",
                hint: "AVANT.SETTINGS.WorldClock.WorldCreatedOn.Hint",
            },
        },
        CampaignFeats: {
            name: "AVANT.SETTINGS.CampaignFeats.Name",
            hint: "AVANT.SETTINGS.CampaignFeats.Hint",
        },
    },

    Actor: {
        documentClasses: {
            army: ArmyAvant,
            character: CharacterAvant,
            npc: NPCAvant,
            hazard: HazardAvant,
            loot: LootAvant,
            familiar: FamiliarAvant,
            party: PartyAvant,
            vehicle: VehicleAvant,
        },
    },

    Item: {
        documentClasses: {
            action: AbilityItemAvant,
            affliction: AfflictionAvant,
            ancestry: AncestryAvant,
            armor: ArmorAvant,
            background: BackgroundAvant,
            backpack: ContainerAvant,
            book: BookAvant,
            campaignFeature: CampaignFeatureAvant,
            class: ClassAvant,
            condition: ConditionAvant,
            consumable: ConsumableAvant,
            deity: DeityAvant,
            effect: EffectAvant,
            equipment: EquipmentAvant,
            feat: FeatAvant,
            heritage: HeritageAvant,
            kit: KitAvant,
            lore: LoreAvant,
            melee: MeleeAvant,
            shield: ShieldAvant,
            spell: SpellAvant,
            spellcastingEntry: SpellcastingEntryAvant,
            treasure: TreasureAvant,
            weapon: WeaponAvant,
        },
    },

    JournalEntry: { sheetClass: JournalSheetAvant },

    Canvas: {
        darkness: {
            default: CONFIG.Canvas.darknessColor,
            gmVision: 0xd1ccff,
        },
    },
};
