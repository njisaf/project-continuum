import type { AMMO_STACK_GROUPS, CONSUMABLE_CATEGORIES } from "./values.ts";

type AmmoStackGroup = SetElement<typeof AMMO_STACK_GROUPS>;
type ConsumableCategory = SetElement<typeof CONSUMABLE_CATEGORIES>;
type ConsumableTrait = keyof typeof CONFIG.AVANT.consumableTraits;
type OtherConsumableTag = "alchemical-food" | "alchemical-tool" | "herbal";

export type { AmmoStackGroup, ConsumableCategory, ConsumableTrait, OtherConsumableTag };
