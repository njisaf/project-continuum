import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import type { RuleElementSource } from "@module/rules/index.ts";
import * as R from "remeda";
import { MigrationBase } from "../base.ts";

/** Move RollOption RE suboption selections to top level of object. */
export class Migration920SuboptionSelection extends MigrationBase {
    static override version = 0.92;

    override async updateItem(source: ItemSourceAvant, actorSource: ActorSourceAvant): Promise<void> {
        const suboptionREs = source.system.rules.filter(
            (r): r is RollOptionSource =>
                "suboptions" in r &&
                Array.isArray(r.suboptions) &&
                r.suboptions.some((s) => R.isPlainObject(s) && typeof s.selected === "boolean"),
        );
        for (const rule of suboptionREs) {
            for (const suboption of rule.suboptions) {
                if (suboption.selected && actorSource) {
                    rule.selection = suboption.value;
                }
                delete suboption.selected;
            }
        }
    }
}

interface RollOptionSource extends RuleElementSource {
    selection?: string;
    suboptions: { value: string; selected?: boolean }[];
}
