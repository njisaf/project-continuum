import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function treatDisease(options: SkillActionOptions): void {
    const slug = options?.skill ?? "medicine";
    const rollOptions = ["action:treat-disease"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.TreatDisease.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["downtime", "manipulate"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.TreatDisease", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.TreatDisease", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.TreatDisease", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    description: "AVANT.Actions.TreatDisease.Description",
    img: "systems/avant/icons/effects/treat-disease.webp",
    name: "AVANT.Actions.TreatDisease.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.TreatDisease.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.TreatDisease.Notes.success" },
        { outcome: ["criticalFailure"], text: "AVANT.Actions.TreatDisease.Notes.criticalFailure" },
    ],
    rollOptions: ["action:treat-disease"],
    section: "skill",
    slug: "treat-disease",
    statistic: "medicine",
    traits: ["downtime", "manipulate"],
});

export { treatDisease as legacy, action };
