import type { ActorType, CharacterAvant, NPCAvant } from "@actor";
import { RuleElementAvant } from "./base.ts";
import { ModelPropsFromRESchema, ResolvableValueField, RuleElementSchema } from "./data.ts";

/**
 * @category RuleElement
 */
class DexterityModifierCapRuleElement extends RuleElementAvant<DexterityModifierCapRuleSchema> {
    protected static override validActorTypes: ActorType[] = ["character", "npc"];

    static override defineSchema(): DexterityModifierCapRuleSchema {
        return {
            ...super.defineSchema(),
            value: new ResolvableValueField({ required: true, nullable: false }),
        };
    }

    override beforePrepareData(): void {
        if (!this.test()) return;

        const value = this.resolveValue(this.value);
        if (typeof value !== "number") {
            return this.failValidation("value must be a number");
        }

        this.actor.synthetics.dexterityModifierCaps.push({
            value,
            source: this.label,
        });
    }
}

interface DexterityModifierCapRuleElement
    extends RuleElementAvant<DexterityModifierCapRuleSchema>,
        ModelPropsFromRESchema<DexterityModifierCapRuleSchema> {
    get actor(): CharacterAvant | NPCAvant;
}

type DexterityModifierCapRuleSchema = RuleElementSchema & {
    value: ResolvableValueField<true, false, false>;
};

export { DexterityModifierCapRuleElement };
