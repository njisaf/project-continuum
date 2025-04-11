import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function track(options: SkillActionOptions): void {
    const slug = options?.skill ?? "survival";
    const rollOptions = ["action:track"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.Track.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["concentrate", "exploration", "move"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Track", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Track", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Track", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    description: "AVANT.Actions.Track.Description",
    img: "icons/skills/movement/arrows-up-trio-red.webp",
    name: "AVANT.Actions.Track.Title",
    notes: [
        { outcome: ["success", "criticalSuccess"], text: "AVANT.Actions.Track.Notes.success" },
        { outcome: ["failure"], text: "AVANT.Actions.Track.Notes.failure" },
        { outcome: ["criticalFailure"], text: "AVANT.Actions.Track.Notes.criticalFailure" },
    ],
    rollOptions: ["action:track"],
    sampleTasks: {
        untrained: "AVANT.Actions.Track.SampleTasks.Untrained",
        trained: "AVANT.Actions.Track.SampleTasks.Trained",
        expert: "AVANT.Actions.Track.SampleTasks.Expert",
        master: "AVANT.Actions.Track.SampleTasks.Master",
        legendary: "AVANT.Actions.Track.SampleTasks.Legendary",
    },
    slug: "track",
    statistic: "survival",
    traits: ["concentrate", "exploration", "move"],
});

export { track as legacy, action };
