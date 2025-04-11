import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function coerce(options: SkillActionOptions): void {
    const slug = options?.skill ?? "intimidation";
    const rollOptions = ["action:coerce"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.Coerce.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["auditory", "concentrate", "emotion", "exploration", "linguistic", "mental"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "will",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Coerce", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Coerce", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Coerce", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Coerce", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    description: "AVANT.Actions.Coerce.Description",
    difficultyClass: "will",
    img: "icons/skills/social/intimidation-impressing.webp",
    name: "AVANT.Actions.Coerce.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.Coerce.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.Coerce.Notes.success" },
        { outcome: ["failure"], text: "AVANT.Actions.Coerce.Notes.failure" },
        { outcome: ["criticalFailure"], text: "AVANT.Actions.Coerce.Notes.criticalFailure" },
    ],
    rollOptions: ["action:coerce"],
    section: "skill",
    slug: "coerce",
    statistic: "intimidation",
    traits: ["auditory", "concentrate", "emotion", "exploration", "linguistic", "mental"],
});

export { coerce as legacy, action };
