import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { ModifierAvant } from "@actor/modifiers.ts";
import {
    SingleCheckAction,
    SingleCheckActionUseOptions,
    SingleCheckActionVariant,
    SingleCheckActionVariantData,
} from "@actor/actions/index.ts";
import { CheckResultCallback } from "@system/action-macros/types.ts";

function subsist(options: SkillActionOptions): void {
    if (!options?.skill) {
        ui.notifications.warn(game.i18n.localize("AVANT.Actions.Subsist.Warning.NoSkill"));
        return;
    }
    const modifiers = [
        new ModifierAvant({
            label: "AVANT.Actions.Subsist.AfterExplorationPenalty",
            modifier: -5,
            predicate: ["action:subsist:after-exploration"],
        }),
    ].concat(options?.modifiers ?? []);
    const { skill: slug } = options;
    const rollOptions = ["action:subsist", `action:subsist:${slug}`];
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.Subsist.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["downtime"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Subsist", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Subsist", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Subsist", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Subsist", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

class SubsistActionVariant extends SingleCheckActionVariant {
    override async use(options: Partial<SingleCheckActionUseOptions> = {}): Promise<CheckResultCallback[]> {
        if (!options?.statistic) {
            throw new Error(game.i18n.localize("AVANT.Actions.Subsist.Warning.NoSkill"));
        }
        const rollOption = `action:subsist:${options.statistic}`;
        options.rollOptions ??= [];
        if (!options.rollOptions.includes(rollOption)) {
            options.rollOptions.push(rollOption);
        }
        return super.use(options);
    }
}

class SubsistAction extends SingleCheckAction {
    constructor() {
        super({
            description: "AVANT.Actions.Subsist.Description",
            img: "icons/environment/settlement/city-hall.webp",
            modifiers: [
                {
                    label: "AVANT.Actions.Subsist.AfterExplorationPenalty",
                    modifier: -5,
                    predicate: ["action:subsist:after-exploration"],
                },
            ],
            name: "AVANT.Actions.Subsist.Title",
            notes: [
                { outcome: ["criticalSuccess"], text: "AVANT.Actions.Subsist.Notes.criticalSuccess" },
                { outcome: ["success"], text: "AVANT.Actions.Subsist.Notes.success" },
                { outcome: ["failure"], text: "AVANT.Actions.Subsist.Notes.failure" },
                { outcome: ["criticalFailure"], text: "AVANT.Actions.Subsist.Notes.criticalFailure" },
            ],
            rollOptions: ["action:subsist"],
            sampleTasks: {
                untrained: "AVANT.Actions.Subsist.SampleTasks.Untrained",
                trained: "AVANT.Actions.Subsist.SampleTasks.Trained",
                expert: "AVANT.Actions.Subsist.SampleTasks.Expert",
                master: "AVANT.Actions.Subsist.SampleTasks.Master",
                legendary: "AVANT.Actions.Subsist.SampleTasks.Legendary",
            },
            section: "skill",
            slug: "subsist",
            statistic: ["society", "survival"],
            traits: ["downtime"],
        });
    }

    protected override toActionVariant(data?: SingleCheckActionVariantData): SingleCheckActionVariant {
        return new SubsistActionVariant(this, data);
    }
}

const action = new SubsistAction();

export { subsist as legacy, action };
