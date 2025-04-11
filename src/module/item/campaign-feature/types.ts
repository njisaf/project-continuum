import { KINGMAKER_CATEGORY_TYPES } from "./values.ts";

type BehaviorType = "feat" | "feature" | "activity";
type KingmakerCategory = (typeof KINGMAKER_CATEGORY_TYPES)[number];
type KingmakerTrait = keyof ConfigAvant["AVANT"]["kingmakerTraits"];

export type { BehaviorType, KingmakerCategory, KingmakerTrait };
