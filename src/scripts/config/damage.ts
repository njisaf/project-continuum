import { DamageCategoryUnique, DamageType } from "@system/damage/types.ts";
import { DAMAGE_TYPES } from "@system/damage/values.ts";
import * as R from "remeda";
import { energyDamageTypes, preciousMaterials } from "./traits.ts";

const damageCategoriesUnique: Record<DamageCategoryUnique, string> = {
    persistent: "AVANT.ConditionTypePersistentShort",
    precision: "AVANT.Damage.Precision",
    splash: "AVANT.TraitSplash",
};

const materialDamageEffects = R.pick(preciousMaterials, [
    "abysium",
    "adamantine",
    "cold-iron",
    "dawnsilver",
    "djezet",
    "duskwood",
    "inubrix",
    "keep-stone",
    "noqual",
    "orichalcum",
    "peachwood",
    "siccatite",
    "silver",
    "sisterstone-dusk",
    "sisterstone-scarlet",
    "sovereign-steel",
    "warpglass",
]);

const damageCategories = {
    ...damageCategoriesUnique,
    ...materialDamageEffects,
    energy: "AVANT.TraitEnergy",
    physical: "AVANT.TraitPhysical",
};

const physicalDamageTypes = {
    bleed: "AVANT.TraitBleed",
    bludgeoning: "AVANT.TraitBludgeoning",
    piercing: "AVANT.TraitPiercing",
    slashing: "AVANT.TraitSlashing",
};

const damageTypes: Record<DamageType, string> = {
    ...energyDamageTypes,
    ...physicalDamageTypes,
    mental: "AVANT.TraitMental",
    poison: "AVANT.TraitPoison",
    spirit: "AVANT.TraitSpirit",
    untyped: "AVANT.TraitUntyped",
};

const damageRollFlavors = [...DAMAGE_TYPES].reduce(
    (result, key) => {
        result[key] = `AVANT.Damage.RollFlavor.${key}`;
        return result;
    },
    {} as Record<DamageType, string>,
);

export {
    damageCategories,
    damageCategoriesUnique,
    damageRollFlavors,
    damageTypes,
    energyDamageTypes,
    materialDamageEffects,
    physicalDamageTypes,
};
