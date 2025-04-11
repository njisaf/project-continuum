import { CreatureAvant } from "@actor";
import { ActorSizeAvant } from "@actor/data/size.ts";
import { ModifierAvant } from "@actor/modifiers.ts";
import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";

function determineSizeBonus(actorSize: ActorSizeAvant, targetSize: ActorSizeAvant) {
    const sizeDifference = actorSize.difference(targetSize);

    return Math.clamp(2 * sizeDifference, -4, 4);
}

export function whirlingThrow(options: SkillActionOptions): void {
    const slug = options?.skill ?? "athletics";
    const rollOptions = ["action:whirling-throw"];
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph ?? "A",
        title: "AVANT.Actions.WhirlingThrow.Title",
        checkContext: (opts) => {
            const modifiers = options.modifiers?.length ? [...options.modifiers] : [];
            if (opts.actor instanceof CreatureAvant && opts.target instanceof CreatureAvant) {
                const actorSize = opts.actor.system.traits.size;
                const targetSize = opts.target.system.traits.size;
                const sizeModifier = new ModifierAvant(
                    "Size Modifier",
                    determineSizeBonus(actorSize, targetSize),
                    "circumstance",
                );
                if (sizeModifier.modifier) {
                    modifiers.push(sizeModifier);
                }
            }
            return ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug });
        },
        traits: ["monk"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "fortitude",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.WhirlingThrow", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.WhirlingThrow", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.WhirlingThrow", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.WhirlingThrow", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}
