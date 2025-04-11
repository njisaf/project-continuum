import type { ActorAvant } from "@actor";
import { ConditionAvant } from "@item";
import { ConditionSource } from "@item/condition/data.ts";
import { ConditionSlug } from "@item/condition/types.ts";
import { CONDITION_SLUGS } from "@item/condition/values.ts";
import type { TokenAvant } from "@module/canvas/index.ts";
import { ErrorAvant, localizer, setHasElement, sluggify, tupleHasValue } from "@util";

/** A helper class to manage Avant Conditions */
export class ConditionManager {
    static #initialized = false;

    static conditions: Map<ConditionSlug | ItemUUID, ConditionAvant<null>> = new Map();

    /** Gets a list of condition slugs. */
    static get conditionsSlugs(): string[] {
        return [...this.conditions.keys()].filter((k) => !k.startsWith("Compendium."));
    }

    static initialize(): void {
        if (this.#initialized) return;

        this.conditions = new Map(
            CONDITION_SOURCES.flatMap((source) => {
                const condition: ConditionAvant<null> = new ConditionAvant(source, { pack: "avant.conditionitems" });
                return [
                    [condition.slug, condition],
                    [condition.uuid, condition],
                ];
            }) ?? [],
        );

        if (game.i18n.lang !== "en") {
            const localize = localizer("AVANT.condition");
            for (const condition of this.conditions.values()) {
                condition.name = condition._source.name = localize(`${condition.slug}.name`);
                condition.system.description.value = condition._source.system.description.value = localize(
                    `${condition.slug}.rules`,
                );
            }
        }

        this.#initialized = true;
    }

    /**
     * Get a condition using the condition name.
     * @param slug A condition slug
     */
    static getCondition(slug: ConditionSlug, modifications?: DeepPartial<ConditionSource>): ConditionAvant<null>;
    static getCondition(slug: string, modifications?: DeepPartial<ConditionSource>): ConditionAvant<null> | null;
    static getCondition(slug: string, modifications: DeepPartial<ConditionSource> = {}): ConditionAvant<null> | null {
        slug = sluggify(slug);
        if (!setHasElement(CONDITION_SLUGS, slug)) return null;

        const condition = ConditionManager.conditions.get(slug)?.clone(modifications);
        if (!condition) throw ErrorAvant("Unexpected failure looking up condition");

        return condition;
    }

    static updateConditionValue(itemId: string, actor: ActorAvant, value: number): Promise<void>;
    static updateConditionValue(itemId: string, token: TokenAvant, value: number): Promise<void>;
    static updateConditionValue(itemId: string, actorOrToken: ActorAvant | TokenAvant, value: number): Promise<void>;
    static async updateConditionValue(
        itemId: string,
        actorOrToken: ActorAvant | TokenAvant,
        value: number,
    ): Promise<void> {
        const actor = "prototypeToken" in actorOrToken ? actorOrToken : actorOrToken.actor;
        const condition = actor?.items.get(itemId);

        if (condition?.isOfType("condition")) {
            if (value === 0) {
                // Value is zero, remove the condition
                await condition.delete();
            } else if (actor?.isOfType("creature")) {
                // Cap the value if a capped condition
                const cappedConditions = ["dying", "wounded", "doomed"] as const;
                if (tupleHasValue(cappedConditions, condition.slug)) {
                    value = Math.min(value, actor.attributes[condition.slug].max);
                }
                await condition.update({ "system.value.value": value });
            }
        }
    }
}
