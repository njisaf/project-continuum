import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";

export function bonMot(options: SkillActionOptions): void {
    const slug = options?.skill ?? "diplomacy";
    const rollOptions = ["action:bon-mot"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph ?? "A",
        title: "AVANT.Actions.BonMot.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["auditory", "concentrate", "emotion", "linguistic", "mental"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "will",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.BonMot", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.BonMot", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.BonMot", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}
