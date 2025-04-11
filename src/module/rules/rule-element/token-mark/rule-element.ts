import { TokenDocumentAvant } from "@scene";
import { SlugField } from "@system/schema-data-fields.ts";
import { ErrorAvant } from "@util";
import { UUIDUtils } from "@util/uuid.ts";
import { RuleElementAvant } from "../base.ts";
import { ModelPropsFromRESchema, RuleElementSchema, RuleElementSource } from "../data.ts";
import { MarkTargetPrompt } from "./prompt.ts";
import fields = foundry.data.fields;

/** Remember a token for later referencing */
class TokenMarkRuleElement extends RuleElementAvant<TokenMarkSchema> {
    static override defineSchema(): TokenMarkSchema {
        return {
            ...super.defineSchema(),
            slug: new SlugField({ required: true, nullable: false, initial: undefined }),
            uuid: new fields.StringField({ required: false, nullable: true, initial: null }),
        };
    }

    override async preCreate({ ruleSource, itemSource, pendingItems }: RuleElementAvant.PreCreateParams): Promise<void> {
        if (this.ignored) return;

        this.uuid &&= this.resolveInjectedProperties(this.uuid);

        if (this.actor.getActiveTokens().length === 0) {
            this.ignored = ruleSource.ignored = true;
            return;
        }

        const token =
            fromUuidSync(this.uuid ?? "") ??
            (game.user.targets.size === 1
                ? Array.from(game.user.targets)[0].document
                : await new MarkTargetPrompt({ prompt: null, requirements: null }).resolveTarget());
        if (!(token instanceof TokenDocumentAvant)) {
            // No token was targeted: abort creating item
            pendingItems.splice(pendingItems.indexOf(itemSource), 1);
            return;
        }

        this.#checkRuleSource(ruleSource);
        this.uuid = ruleSource.uuid = token.uuid;
    }

    override beforePrepareData(): void {
        if (UUIDUtils.isTokenUUID(this.uuid) && this.test()) {
            this.actor.synthetics.tokenMarks.set(this.uuid, this.slug);
        }
    }

    #checkRuleSource(source: RuleElementSource): asserts source is MarkTokenSource {
        if (!(source.key === "TokenMark" && source.slug === this.slug)) {
            throw ErrorAvant("Unexpected rule element passed");
        }
    }
}

type TokenMarkSchema = Omit<RuleElementSchema, "slug"> & {
    slug: SlugField<true, false, false>;
    uuid: fields.StringField<string, string, false, true, true>;
};

interface TokenMarkRuleElement extends RuleElementAvant<TokenMarkSchema>, ModelPropsFromRESchema<TokenMarkSchema> {
    slug: string;
}

interface MarkTokenSource extends RuleElementSource {
    slug?: JSONValue;
    uuid?: JSONValue;
}

export { TokenMarkRuleElement };
