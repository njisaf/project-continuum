import type { ActorAvant } from "@actor";
import type { AbilityItemAvant } from "@item";
import type { FeatAvant } from "./document.ts";

/**
 * Whether a feat item can have key ability options
 * The item must be a level-1 class feature that is either not (RE-)granted or is granted by another class feature. It
 * must also only have at most a single trait (assumed to be that of the class)
 */
function featCanHaveKeyOptions(feat: FeatAvant): boolean {
    if (feat.category !== "classfeature" || feat.level !== 1 || feat.traits.size > 1) {
        return false;
    }

    const { grantedBy } = feat;
    return !grantedBy || (grantedBy.isOfType("feat") && grantedBy.category === "classfeature");
}

/** Recursively suppresses a feat and its granted feats */
function suppressFeats(feats: (FeatAvant | AbilityItemAvant)[]): void {
    for (const featOrAbility of feats) {
        featOrAbility.suppressed = true;
        const allGrants = Object.values(featOrAbility.flags.avant.itemGrants)
            .map((g) => featOrAbility.actor?.items.get(g.id))
            .filter((i): i is FeatAvant<ActorAvant> | AbilityItemAvant<ActorAvant> => !!i?.isOfType("action", "feat"));
        suppressFeats(allGrants);
    }
}

export { featCanHaveKeyOptions, suppressFeats };
