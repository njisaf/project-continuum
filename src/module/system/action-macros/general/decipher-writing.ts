import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import {
    SingleCheckAction,
    SingleCheckActionUseOptions,
    SingleCheckActionVariant,
    SingleCheckActionVariantData,
} from "@actor/actions/index.ts";
import { CheckResultCallback } from "@system/action-macros/types.ts";

function decipherWriting(options: SkillActionOptions): void {
    if (!options?.skill) {
        ui.notifications.warn(game.i18n.localize("AVANT.Actions.DecipherWriting.Warning.NoSkill"));
        return;
    }
    const { skill: slug } = options;
    const rollOptions = ["action:decipher-writing", `action:decipher-writing:${slug}`];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.DecipherWriting.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["concentrate", "exploration", "secret"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.DecipherWriting", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.DecipherWriting", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.DecipherWriting", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.DecipherWriting", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

class DecipherWritingActionVariant extends SingleCheckActionVariant {
    override async use(
        options: Partial<SingleCheckActionUseOptions> & { statistic: string },
    ): Promise<CheckResultCallback[]> {
        if (!options?.statistic) {
            throw new Error(game.i18n.localize("AVANT.Actions.DecipherWriting.Warning.NoSkill"));
        }
        const rollOption = `action:decipher-writing:${options.statistic}`;
        options.rollOptions ??= [];
        if (!options.rollOptions.includes(rollOption)) {
            options.rollOptions.push(rollOption);
        }
        return super.use(options);
    }
}

class DecipherWritingAction extends SingleCheckAction {
    constructor() {
        super({
            description: "AVANT.Actions.DecipherWriting.Description",
            img: "icons/skills/social/diplomacy-writing-letter.webp",
            name: "AVANT.Actions.DecipherWriting.Title",
            notes: [
                { outcome: ["criticalSuccess"], text: "AVANT.Actions.DecipherWriting.Notes.criticalSuccess" },
                { outcome: ["success"], text: "AVANT.Actions.DecipherWriting.Notes.success" },
                { outcome: ["failure"], text: "AVANT.Actions.DecipherWriting.Notes.failure" },
                { outcome: ["criticalFailure"], text: "AVANT.Actions.DecipherWriting.Notes.criticalFailure" },
            ],
            rollOptions: ["action:decipher-writing"],
            sampleTasks: {
                trained: "AVANT.Actions.DecipherWriting.SampleTasks.Trained",
                expert: "AVANT.Actions.DecipherWriting.SampleTasks.Expert",
                master: "AVANT.Actions.DecipherWriting.SampleTasks.Master",
                legendary: "AVANT.Actions.DecipherWriting.SampleTasks.Legendary",
            },
            section: "skill",
            slug: "decipher-writing",
            statistic: ["arcana", "occultism", "religion", "society"],
            traits: ["concentrate", "exploration", "secret"],
        });
    }

    protected override toActionVariant(data?: SingleCheckActionVariantData): SingleCheckActionVariant {
        return new DecipherWritingActionVariant(this, data);
    }
}

const action = new DecipherWritingAction();

export { decipherWriting as legacy, action };
