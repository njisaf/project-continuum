import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { SingleCheckAction } from "@actor/actions/index.ts";

function disableDevice(options: SkillActionOptions): void {
    const slug = options?.skill ?? "thievery";
    const rollOptions = ["action:disable-a-device", "action:disable-device"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options?.actors,
        actionGlyph: options?.glyph ?? "D",
        title: "AVANT.Actions.DisableDevice.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["manipulate"],
        event: options?.event,
        callback: options?.callback,
        difficultyClass: options?.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.DisableDevice", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.DisableDevice", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.DisableDevice", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

const action = new SingleCheckAction({
    cost: 2,
    description: "AVANT.Actions.DisableDevice.Description",
    img: "systems/avant/icons/features/classes/thief.webp",
    name: "AVANT.Actions.DisableDevice.Title",
    notes: [
        { outcome: ["criticalSuccess"], text: "AVANT.Actions.DisableDevice.Notes.criticalSuccess" },
        { outcome: ["success"], text: "AVANT.Actions.DisableDevice.Notes.success" },
        { outcome: ["criticalFailure"], text: "AVANT.Actions.DisableDevice.Notes.criticalFailure" },
    ],
    rollOptions: ["action:disable-a-device", "action:disable-device"],
    section: "skill",
    slug: "disable-device",
    statistic: "thievery",
    traits: ["manipulate"],
});

export { disableDevice as legacy, action };
