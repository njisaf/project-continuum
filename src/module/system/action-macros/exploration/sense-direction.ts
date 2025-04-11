import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { ModifierAvant } from "@actor/modifiers.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function senseDirection(options: SkillActionOptions): void {
    const modifiers = [
        new ModifierAvant({
            label: "AVANT.Actions.SenseDirection.Modifier.NoCompass",
            modifier: -2,
            predicate: [{ not: "compass-in-possession" }],
            type: "item",
        }),
    ].concat(options?.modifiers ?? []);
    const slug = options?.skill ?? "survival";
    const rollOptions = ["action:sense-direction"];
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.SenseDirection.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["exploration", "secret"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseDirection", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.SenseDirection", "success"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    description: "AVANT.Actions.SenseDirection.Description",
    img: "icons/skills/movement/arrow-upward-yellow.webp",
    modifiers: [
        {
            label: "AVANT.Actions.SenseDirection.Modifier.NoCompass",
            modifier: -2,
            predicate: [{ not: "compass-in-possession" }],
            type: "item",
        },
    ],
    name: "AVANT.Actions.SenseDirection.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.SenseDirection.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.SenseDirection.Notes.success" },
    ],
    rollOptions: ["action:sense-direction"],
    sampleTasks: {
        untrained: "AVANT.Actions.SenseDirection.SampleTasks.Untrained",
        trained: "AVANT.Actions.SenseDirection.SampleTasks.Trained",
        expert: "AVANT.Actions.SenseDirection.SampleTasks.Expert",
        master: "AVANT.Actions.SenseDirection.SampleTasks.Master",
        legendary: "AVANT.Actions.SenseDirection.SampleTasks.Legendary",
    },
    slug: "sense-direction",
    statistic: "survival",
    traits: ["exploration", "secret"],
});

export { senseDirection as legacy, action };
