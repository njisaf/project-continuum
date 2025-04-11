import { htmlQueryAll } from "@util/dom.ts";
import { tagify } from "@util/tags.ts";
import { RuleElementForm } from "./base.ts";

class ActorTraitsForm extends RuleElementForm {
    override template = "systems/avant/templates/items/rules/actor-traits.hbs";
    override activateListeners(html: HTMLElement): void {
        super.activateListeners(html);
        for (const input of htmlQueryAll<HTMLInputElement>(html, "input.avant-tagify")) {
            tagify(input, { whitelist: CONFIG.AVANT.creatureTraits, enforceWhitelist: false });
        }
    }
}

export { ActorTraitsForm };
