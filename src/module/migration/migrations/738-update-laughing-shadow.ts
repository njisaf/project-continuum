import { ActorSourceAvant } from "@actor/data/index.ts";
import type { ItemAvant } from "@item";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { MigrationBase } from "../base.ts";

/** Update the rule elements of the Laughing Shadow hybrid study, remove its presence from Arcane Cascade rules */
export class Migration738UpdateLaughingShadow extends MigrationBase {
    static override version = 0.738;

    #shadowPromise = fromUuid<ItemAvant>("Compendium.avant.classfeatures.3gVDqDPSz4fB5T9G");

    #cascadePromise = fromUuid<ItemAvant>("Compendium.avant.feature-effects.fsjO5oTKttsbpaKl");

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        const rollOptionsAll = source.flags.avant?.rollOptions?.all;
        if (rollOptionsAll instanceof Object && "feature:laughing-shadow:damage" in rollOptionsAll) {
            rollOptionsAll["-=feature:laughing-shadow:damage"] = false;
        }
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type === "feat" && source.system.slug === "laughing-shadow") {
            const laughingShadow = await this.#shadowPromise;
            if (!laughingShadow) return;
            source.system.rules = fu.deepClone(laughingShadow._source.system.rules);
        } else if (source.type === "effect" && source.system.slug === "stance-arcane-cascade") {
            const arcaneCascade = await this.#cascadePromise;
            if (!arcaneCascade) return;

            const newRules = fu.deepClone(arcaneCascade._source.system.rules);

            // Retrieve the ChoiceSet selection if one has been made
            const withSelection = source.system.rules.find(
                (r: RuleElementSource & { selection?: unknown }): r is RuleElementSource & { selection: string } =>
                    r.key === "ChoiceSet" && typeof r.selection === "string",
            );

            if (withSelection) {
                const unselected = newRules.find(
                    (r: RuleElementSource & { selection?: unknown }): r is RuleElementSource & { selection?: string } =>
                        r.key === "ChoiceSet",
                );
                if (unselected) unselected.selection = withSelection.selection;
            }

            source.system.rules = newRules;
        }
    }
}
