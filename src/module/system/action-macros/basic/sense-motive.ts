import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function senseMotive(options: SkillActionOptions): void {
    const slug = options?.skill ?? "perception";
    const rollOptions = ["action:sense-motive"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph ?? "A",
        title: "AVANT.Actions.SenseMotive.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["concentrate", "secret"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "deception",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseMotive", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseMotive", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseMotive", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseMotive", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    cost: 1,
    description: "AVANT.Actions.SenseMotive.Description",
    difficultyClass: "deception",
    img: "icons/skills/movement/arrow-upward-yellow.webp",
    name: "AVANT.Actions.SenseMotive.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.SenseMotive.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.SenseMotive.Notes.success" },
        { outcome: ["failure"], text: "AVANT.Actions.SenseMotive.Notes.failure" },
        { outcome: ["criticalFailure"], text: "AVANT.Actions.SenseMotive.Notes.criticalFailure" },
    ],
    rollOptions: ["action:sense-motive"],
    section: "basic",
    slug: "sense-motive",
    statistic: "perception",
    traits: ["concentrate", "secret"],
});

export { senseMotive as legacy, action };
