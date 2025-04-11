import { ItemSourceAvant } from "@item/base/data/index.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { sluggify } from "@util";
import { MigrationBase } from "../base.ts";

/**
 * Move weapon specialization to rule elements.
 */
export class Migration857WeaponSpecializationRE extends MigrationBase {
    static override version = 0.857;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        const slug = source.system.slug ?? sluggify(source.name);
        if (
            source.type !== "feat" ||
            !slug.includes("weapon-specialization") ||
            slug.includes("eidolon-weapon-specialization")
        ) {
            return;
        }

        // If this already has the REs, skip
        const hasREs = source.system.rules.some((r) => r.slug === "weapon-specialization");
        if (hasREs) return;

        // Add the new rule elements
        if (slug.includes("greater-weapon-specialization")) {
            source.system.rules.unshift({
                key: "AdjustModifier",
                mode: "multiply",
                relabel: "AVANT.GreaterWeaponSpecialization",
                selector: "strike-damage",
                slug: "weapon-specialization",
                value: 2,
            } as RuleElementSource);
        } else {
            source.system.rules.unshift(
                {
                    hideIfDisabled: true,
                    key: "FlatModifier",
                    label: "AVANT.WeaponSpecialization",
                    predicate: [
                        {
                            gte: ["item:proficiency:rank", 2],
                        },
                    ],
                    selector: "strike-damage",
                    slug: "weapon-specialization",
                    value: 2,
                } as RuleElementSource,
                {
                    key: "AdjustModifier",
                    mode: "upgrade",
                    predicate: ["item:proficiency:rank:3"],
                    priority: 0,
                    selector: "strike-damage",
                    slug: "weapon-specialization",
                    value: 3,
                } as RuleElementSource,
                {
                    key: "AdjustModifier",
                    mode: "upgrade",
                    predicate: ["item:proficiency:rank:4"],
                    priority: 0,
                    selector: "strike-damage",
                    slug: "weapon-specialization",
                    value: 4,
                } as RuleElementSource,
            );
        }
    }
}
