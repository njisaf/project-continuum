import { ItemSourceAvant } from "@item/base/data/index.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { AELikeSchema } from "@module/rules/rule-element/ae-like.ts";
import { recursiveReplaceString } from "@util";
import { MigrationBase } from "../base.ts";

/** Set the same flag ("avant.innovationId") from all innovation class features  */
export class Migration851JustInnovationId extends MigrationBase {
    static override version = 0.851;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type !== "feat") return;

        source.system.rules = source.system.rules.map((r) =>
            recursiveReplaceString(r, (s) => s.replace("flags.avant.armorInnovationId", "flags.avant.innovationId")),
        );

        const hasAELike = source.system.rules.some(
            (r: MaybeAELikeSource) => r.key === "ActiveEffectLike" && r.path === "flags.avant.innovationId",
        );
        if (source.system.slug === "weapon-innovation" && !hasAELike) {
            const reSource: Pick<SourceFromSchema<AELikeSchema>, "key" | "mode" | "path" | "value"> = {
                key: "ActiveEffectLike",
                mode: "override",
                path: "flags.avant.innovationId",
                value: "{item|flags.avant.itemGrants.weaponInnovation.id}",
            };
            source.system.rules.push(reSource);
        } else if (source.system.slug === "construct-innovation" && !hasAELike) {
            const reSource: Pick<SourceFromSchema<AELikeSchema>, "key" | "mode" | "path" | "value"> = {
                key: "ActiveEffectLike",
                mode: "override",
                path: "flags.avant.innovationId",
                value: null,
            };
            source.system.rules.push(reSource);
        } else if (source.system.slug === "inventor-weapon-expertise") {
            const hasCritSpec = source.system.rules.some((r) => r.key === "CriticalSpecialization");
            if (!hasCritSpec) {
                const reSource = {
                    key: "CriticalSpecialization",
                    predicate: ["feature:weapon-innovation", "item:id:{actor|flags.avant.innovationId}"],
                };
                source.system.rules.push(reSource);
            }
        }
    }
}

interface MaybeAELikeSource extends RuleElementSource {
    mode?: unknown;
    path?: unknown;
    phase?: unknown;
}
