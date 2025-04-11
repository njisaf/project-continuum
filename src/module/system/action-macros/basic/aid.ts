import {
    SingleCheckAction,
    SingleCheckActionUseOptions,
    SingleCheckActionVariant,
    SingleCheckActionVariantData,
} from "@actor/actions/index.ts";
import { CheckResultCallback } from "@system/action-macros/types.ts";

class AidActionVariant extends SingleCheckActionVariant {
    override async use(options: Partial<SingleCheckActionUseOptions>): Promise<CheckResultCallback[]> {
        if (!options?.statistic) {
            throw new Error(game.i18n.localize("AVANT.Actions.Aid.Warning.NoStatistic"));
        }
        const rollOption = `action:aid:${options.statistic}`;
        options.rollOptions ??= [];
        if (!options.rollOptions.includes(rollOption)) {
            options.rollOptions.push(rollOption);
        }
        return super.use(options);
    }
}

class AidAction extends SingleCheckAction {
    constructor() {
        super({
            cost: "reaction",
            description: "AVANT.Actions.Aid.Description",
            difficultyClass: {
                value: 15,
            },
            name: "AVANT.Actions.Aid.Title",
            notes: [
                {
                    outcome: ["criticalFailure"],
                    text: "AVANT.Actions.Aid.Notes.criticalFailure",
                    title: "AVANT.Check.Result.Degree.Check.criticalFailure",
                },
                {
                    outcome: ["criticalSuccess"],
                    text: "AVANT.Actions.Aid.Notes.criticalSuccess",
                    title: "AVANT.Check.Result.Degree.Check.criticalSuccess",
                },
                {
                    outcome: ["success"],
                    text: "AVANT.Actions.Aid.Notes.success",
                    title: "AVANT.Check.Result.Degree.Check.success",
                },
            ],
            rollOptions: ["action:aid"],
            section: "basic",
            slug: "aid",
            statistic: "",
        });
    }

    protected override toActionVariant(data?: SingleCheckActionVariantData): SingleCheckActionVariant {
        return new AidActionVariant(this, data);
    }
}

const aid = new AidAction();

export { aid };
