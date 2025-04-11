import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

const PREFIX = "AVANT.Actions.MakeAnImpression";

function makeAnImpression(options: SkillActionOptions): void {
    const slug = options?.skill ?? "diplomacy";
    const rollOptions = ["action:make-an-impression"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.MakeAnImpression.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["auditory", "concentrate", "exploration", "linguistic", "mental"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "will",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.MakeAnImpression", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.MakeAnImpression", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.MakeAnImpression", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    description: `${PREFIX}.Description`,
    difficultyClass: "will",
    img: "icons/skills/social/diplomacy-peace-alliance.webp",
    name: `${PREFIX}.Title`,
    notes: [
        { outcome: ["criticalSuccess"], text: `${PREFIX}.Notes.criticalSuccess` },
        { outcome: ["success"], text: `${PREFIX}.Notes.success` },
        { outcome: ["criticalFailure"], text: `${PREFIX}.Notes.criticalFailure` },
    ],
    rollOptions: ["action:make-an-impression"],
    section: "skill",
    slug: "make-an-impression",
    statistic: "diplomacy",
    traits: ["auditory", "concentrate", "exploration", "linguistic", "mental"],
});

export { makeAnImpression as legacy, action };
