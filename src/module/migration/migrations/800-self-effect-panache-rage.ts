import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { recursiveReplaceString } from "@util";
import { MigrationBase } from "../base.ts";

/** Rename any predicate statement of "rage" or "panache" to a statement that the effect is present  */
export class Migration800SelfEffectPanacheRage extends MigrationBase {
    static override version = 0.8;

    override async updateItem(source: ItemSourceAvant, actorSource?: ActorSourceAvant): Promise<void> {
        if (
            actorSource?._id === "bpTQfx4UixMV3Fja" ||
            actorSource?._stats.compendiumSource === "Compendium.avant.extinction-curse-bestiary.Actor.bpTQfx4UixMV3Fja"
        ) {
            // Skip "Kharostan" for this due to having a weird rage toggle
            return;
        }

        for (const rule of source.system.rules) {
            if (rule.predicate && Array.isArray(rule.predicate)) {
                rule.predicate = recursiveReplaceString(rule.predicate, (s) =>
                    s.replace(/^(rage|panache)$/, "self:effect:$1"),
                );
            }
        }
    }
}
