import type { CreatureAvant } from "@actor";
import { eventToRollParams } from "@module/sheet/helpers.ts";
import type { SceneAvant, TokenDocumentAvant } from "@scene";

export async function perceptionForSelected(event: JQuery.ClickEvent): Promise<void> {
    const actors = canvas.tokens.controlled
        .flatMap((t) => t.actor ?? [])
        .filter((a): a is CreatureAvant<TokenDocumentAvant<SceneAvant> | null> => !!a.isOfType("creature"));
    if (actors.length === 0) {
        ui.notifications.error("You must select at least one PC/NPC token.");
        return;
    }

    const argsFromEvent = eventToRollParams(event, { type: "check" });
    for (const actor of actors) {
        await actor.perception.roll({ ...argsFromEvent, traits: ["secret"] });
    }
}
