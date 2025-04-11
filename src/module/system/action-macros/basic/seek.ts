import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function seek(options: SkillActionOptions): void {
    const slug = options?.skill ?? "perception";
    const rollOptions = ["action:seek"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph ?? "A",
        title: "AVANT.Actions.Seek.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["concentrate", "secret"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Seek", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Seek", "success"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    cost: 1,
    description: "AVANT.Actions.Seek.Description",
    img: "icons/skills/movement/arrow-upward-yellow.webp",
    name: "AVANT.Actions.Seek.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.Seek.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.Seek.Notes.success" },
    ],
    rollOptions: ["action:seek"],
    section: "basic",
    slug: "seek",
    statistic: "perception",
    traits: ["concentrate", "secret"],
});

export { seek as legacy, action };
