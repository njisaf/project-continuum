import { ItemSourceAvant } from "@item/base/data/index.ts";
import { AELikeSource } from "@module/rules/rule-element/ae-like.ts";
import { RuleElementSource } from "@module/rules/index.ts";
import { MigrationBase } from "../base.ts";

/**
 * Update rule elements on Bomber, Chirurgeon, Mutagenist, Toxicologist, Research Field, Field Discovery,
 * Greater Field Discovery, Perpetual Infusions, Perpetual Potency and Perpetual Perfection
 */
export class Migration816AlchemistResearchFields extends MigrationBase {
    static override version = 0.816;

    get #bomberSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.alchemist",
            value: {
                fieldDiscovery: "Compendium.avant.classfeatures.8QAFgy9U8PxEa7Dw",
                greaterFieldDiscovery: "Compendium.avant.classfeatures.RGs4uR3CAvgbtBAA",
                perpetualInfusions: "Compendium.avant.classfeatures.DFQDtT1Van4fFEHi",
                perpetualPerfection: "Compendium.avant.classfeatures.xO90iBD8XNGyaCkz",
                perpetualPotency: "Compendium.avant.classfeatures.8rEVg03QJ71ic3PP",
            },
        };
    }

    get #chirurgeonSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.alchemist",
            value: {
                fieldDiscovery: "Compendium.avant.classfeatures.qC0Iz6SlG2i9gv6g",
                greaterFieldDiscovery: "Compendium.avant.classfeatures.JJcaVijwRt9dsnac",
                perpetualInfusions: "Compendium.avant.classfeatures.fzvIe6FwwCuIdnjX",
                perpetualPerfection: "Compendium.avant.classfeatures.YByJ9O7oe8wxfbqs",
                perpetualPotency: "Compendium.avant.classfeatures.VS5vkqUQu4n7E28Y",
            },
        };
    }

    get #mutagenistSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.alchemist",
            value: {
                fieldDiscovery: "Compendium.avant.classfeatures.V4Jt7eDnJBLv5bDj",
                greaterFieldDiscovery: "Compendium.avant.classfeatures.1BKdOJ0HNL6Eg3xw",
                perpetualInfusions: "Compendium.avant.classfeatures.Dug1oaVYejLmYEFt",
                perpetualPerfection: "Compendium.avant.classfeatures.CGetAmSbv06fW7GT",
                perpetualPotency: "Compendium.avant.classfeatures.mZFqRLYOQEqKA8ri",
            },
        };
    }

    get #toxicologistSetFlags(): AELikeSource {
        return {
            key: "ActiveEffectLike",
            mode: "override",
            path: "flags.avant.alchemist",
            value: {
                fieldDiscovery: "Compendium.avant.classfeatures.6zo2PJGYoig7nFpR",
                greaterFieldDiscovery: "Compendium.avant.classfeatures.tnqyQrhrZeDtDvcO",
                perpetualInfusions: "Compendium.avant.classfeatures.LlZ5R50z9j8jysZL",
                perpetualPerfection: "Compendium.avant.classfeatures.3R19zS7gERhEX87F",
                perpetualPotency: "Compendium.avant.classfeatures.JOdbVu14phvdjhaY",
            },
        };
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type !== "feat" || !source.system.slug) return;

        if (
            source.system.rules.some(
                (r: MaybeAELikeSource): r is MaybeAELikeSource =>
                    r.key === "ActiveEffectLike" && r.path === "flags.avant.alchemist",
            )
        ) {
            return;
        }

        switch (source.system.slug) {
            case "bomber": {
                source.system.rules.push(this.#bomberSetFlags);
                break;
            }
            case "chirurgeon": {
                source.system.rules.push(this.#chirurgeonSetFlags);
                break;
            }
            case "mutagenist": {
                source.system.rules.push(this.#mutagenistSetFlags);
                break;
            }
            case "toxicologist": {
                source.system.rules.push(this.#toxicologistSetFlags);
                break;
            }
        }
    }
}

interface MaybeAELikeSource extends RuleElementSource {
    path?: unknown;
}
