import { ItemSourceAvant } from "@item/base/data/index.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { AELikeSource } from "@module/rules/rule-element/ae-like.ts";
import { MigrationBase } from "../base.ts";

/**
 * Update rule elements on the Cleric doctrines to include references to the granted doctrines.
 */
export class Migration831ClericDoctrines extends MigrationBase {
    static override version = 0.831;

    get #cloisteredClericSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.cleric",
            value: {
                firstDoctrine: "Compendium.avant.classfeatures.aiwxBj5MjnafCMyn",
                secondDoctrine: "Compendium.avant.classfeatures.sa7BWfnyCswAvBVa",
                thirdDoctrine: "Compendium.avant.classfeatures.s8WEmc4GGZSHSC7q",
                fourthDoctrine: "Compendium.avant.classfeatures.vxOf4LXZcqUG3P7a",
                fifthDoctrine: "Compendium.avant.classfeatures.n9W8MjjRgPpUTvWf",
                finalDoctrine: "Compendium.avant.classfeatures.DgGefatQ4v6xT6f9",
            },
        };
    }

    get #warpriestSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.cleric",
            value: {
                firstDoctrine: "Compendium.avant.classfeatures.xxkszluN9icAiTO4",
                secondDoctrine: "Compendium.avant.classfeatures.D34mPo29r1J3DPaX",
                thirdDoctrine: "Compendium.avant.classfeatures.Zp81uTBItG1xlH4O",
                fourthDoctrine: "Compendium.avant.classfeatures.px3gVYp7zlEQIpcl",
                fifthDoctrine: "Compendium.avant.classfeatures.kmimy4VOaoEOgOiQ",
                finalDoctrine: "Compendium.avant.classfeatures.N1ugDqZlslxbp3Uy",
            },
        };
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type !== "feat" || !source.system.slug) return;

        if (
            source.system.rules.some(
                (r: MaybeAELikeSource): r is MaybeAELikeSource =>
                    r.key === "ActiveEffectLike" && r.path === "flags.avant.cleric",
            )
        ) {
            return;
        }

        switch (source.system.slug) {
            case "cloistered-cleric": {
                source.system.rules.push(this.#cloisteredClericSetFlags);
                break;
            }
            case "warpriest": {
                source.system.rules.push(this.#warpriestSetFlags);
                break;
            }
        }
    }
}

interface MaybeAELikeSource extends RuleElementSource {
    path?: unknown;
}
