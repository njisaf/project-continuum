import { EffectAvant } from "@item";
import { ActiveEffectAvant } from "@module/active-effect.ts";
import { isImageFilePath } from "@util";
import { RuleElementAvant } from "./base.ts";
import { ModelPropsFromRESchema, RuleElementSchema } from "./data.ts";
import fields = foundry.data.fields;

/**
 * Add an effect icon to an actor's token
 * @category RuleElement
 */
class TokenEffectIconRuleElement extends RuleElementAvant<TokenEffectIconSchema> {
    static override defineSchema(): TokenEffectIconSchema {
        return {
            ...super.defineSchema(),
            value: new fields.StringField({ required: false, blank: false, initial: undefined }),
        };
    }

    override afterPrepareData(): void {
        if (!this.test()) return;

        const path = this.value ? this.resolveInjectedProperties(this.value).trim() : this.item.img;
        if (!isImageFilePath(path)) {
            return this.failValidation("value: must resolve to an image file path");
        }
        this.actor.synthetics.tokenEffectIcons.push(
            ActiveEffectAvant.fromEffect(
                new EffectAvant(
                    {
                        type: "effect",
                        name: this.label,
                        img: path,
                        system: { description: { value: this.item.description } },
                    },
                    { parent: this.actor },
                ),
            ),
        );
    }
}

interface TokenEffectIconRuleElement
    extends RuleElementAvant<TokenEffectIconSchema>,
        ModelPropsFromRESchema<TokenEffectIconSchema> {}

type TokenEffectIconSchema = RuleElementSchema & {
    value: fields.StringField<string, string, false, false, false>;
};

export { TokenEffectIconRuleElement };
