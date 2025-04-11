import { CharacterAvant, NPCAvant, type ActorAvant } from "@actor";
import {
    ActionCheckPreview,
    SingleCheckAction,
    SingleCheckActionVariant,
    SingleCheckActionVariantData,
} from "@actor/actions/index.ts";
import type { StrikeData } from "@actor/data/base.ts";
import { StatisticModifier } from "@actor/modifiers.ts";
import type { ItemAvant } from "@item";
import type { CheckContextData, CheckContextOptions, CheckMacroContext } from "@system/action-macros/types.ts";
import type { Statistic } from "@system/statistic/index.ts";
import { CheckContextError } from "../helpers.ts";
import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";

const toHighestModifier = (highest: StrikeData | null, current: StrikeData): StrikeData | null => {
    return current.totalModifier > (highest?.totalModifier ?? Number.MIN_SAFE_INTEGER) ? current : highest;
};

function unarmedStrikeWithHighestModifier<ItemType extends ItemAvant<ActorAvant>>(
    opts: CheckContextOptions<ItemType>,
    data: CheckContextData<ItemType>,
) {
    const actionRollOptions = ["action:escape", "action:escape:unarmed"];
    const { rollOptions } = opts.buildContext({
        actor: opts.actor,
        rollOptions: actionRollOptions,
        target: opts.target,
    });
    const actor = opts.actor;
    const strikes = (() => {
        if (actor instanceof CharacterAvant) {
            return actor.system.actions.filter((strike) =>
                strike.weaponTraits.map((trait) => trait.name).includes("unarmed"),
            );
        } else if (actor instanceof NPCAvant) {
            return actor.system.actions.filter((strike) => strike.item.category === "unarmed");
        }
        return [] as StrikeData[];
    })();
    const statistic = strikes
        .map((strike) => {
            const modifiers = (strike.modifiers ?? []).concat(data.modifiers ?? []);
            return new StatisticModifier("unarmed", modifiers, rollOptions) as StrikeData;
        })
        .reduce(toHighestModifier, null);
    return statistic ? { actor, rollOptions, statistic } : null;
}

function escapeCheckContext<ItemType extends ItemAvant<ActorAvant>>(
    opts: CheckContextOptions<ItemType>,
    data: CheckContextData<ItemType>,
): CheckMacroContext<ItemType> | undefined {
    // find all unarmed strikes and pick the one with the highest modifier
    const unarmed = data.slug && data.slug !== "unarmed" ? null : unarmedStrikeWithHighestModifier(opts, data);

    // filter out any unarmed variants, as those are handled above
    const candidates = data.slug ? [data.slug] : ["acrobatics", "athletics"];
    const alternatives = candidates
        .filter((slug) => slug !== "unarmed")
        .map((slug) => opts.actor.getStatistic(slug))
        .filter((statistic): statistic is Statistic => !!statistic)
        .map((statistic) => {
            const actionRollOptions = ["action:escape", `action:escape:${statistic.slug}`];
            const rollOptions = opts.buildContext({
                actor: opts.actor,
                rollOptions: actionRollOptions,
                target: opts.target,
            }).rollOptions;
            return {
                actor: opts.actor,
                rollOptions,
                statistic: new StatisticModifier(
                    statistic.slug,
                    statistic.modifiers.concat(data.modifiers ?? []),
                    rollOptions,
                ) as StrikeData,
            };
        });

    // find the highest modifier of unarmed, acrobatics, and athletics
    const highest = alternatives.reduce(
        (highest, current) =>
            !highest || current.statistic.totalModifier > (highest?.statistic.totalModifier ?? 0) ? current : highest,
        unarmed,
    );

    if (highest) {
        const { checkType, stat: slug, subtitle } = ActionMacroHelpers.resolveStat(highest.statistic.slug, opts.actor);
        return {
            modifiers: data.modifiers,
            rollOptions: highest.rollOptions,
            slug,
            statistic: highest.statistic,
            subtitle,
            type: checkType,
        };
    }
    throw new CheckContextError("No applicable statistic to roll for Escape check.", opts.actor, "null");
}

function escape(options: SkillActionOptions): void {
    const slug = options?.skill ?? "";
    const modifiers = options?.modifiers;
    const rollOptions = ["action:escape"];
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        checkContext: (opts) => escapeCheckContext(opts, { modifiers, rollOptions, slug }),
        actionGlyph: options.glyph ?? "A",
        title: "AVANT.Actions.Escape.Title",
        traits: ["attack"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "athletics",
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Escape", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Escape", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Escape", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

class EscapeActionVariant extends SingleCheckActionVariant {
    override get statistic(): string {
        return ""; // default to the highest modifier, instead of just unarmed
    }

    protected override checkContext<ItemType extends ItemAvant<ActorAvant>>(
        opts: CheckContextOptions<ItemType>,
        data: CheckContextData<ItemType>,
    ): CheckMacroContext<ItemType> | undefined {
        return escapeCheckContext(opts, data);
    }

    protected override toActionCheckPreview(options: {
        actor?: ActorAvant;
        rollOptions: string[];
        slug: string;
    }): ActionCheckPreview | null {
        return this.#unarmedCheckPreview(options) ?? super.toActionCheckPreview(options);
    }

    #unarmedCheckPreview(args: { actor?: ActorAvant; rollOptions: string[]; slug: string }): ActionCheckPreview | null {
        if (args.slug === "unarmed") {
            if (args.actor) {
                const options = { actor: args.actor, buildContext: () => ({ rollOptions: args.rollOptions }) };
                const data = { rollOptions: args.rollOptions, slug: args.slug };
                const statistic = unarmedStrikeWithHighestModifier(options, data)?.statistic;
                if (statistic) {
                    return {
                        label: game.i18n.localize("AVANT.TraitUnarmed"),
                        modifier: statistic.totalModifier,
                        slug: args.slug,
                    };
                }
            }
            return {
                label: game.i18n.localize("AVANT.TraitUnarmed"),
                slug: args.slug,
            };
        }
        return null;
    }
}

class EscapeAction extends SingleCheckAction {
    constructor() {
        super({
            cost: 1,
            description: "AVANT.Actions.Escape.Description",
            difficultyClass: "athletics",
            img: "icons/skills/movement/figure-running-gray.webp",
            name: "AVANT.Actions.Escape.Title",
            notes: [
                { outcome: ["criticalSuccess"], text: "AVANT.Actions.Escape.Notes.criticalSuccess" },
                { outcome: ["success"], text: "AVANT.Actions.Escape.Notes.success" },
                { outcome: ["criticalFailure"], text: "AVANT.Actions.Escape.Notes.criticalFailure" },
            ],
            rollOptions: ["action:escape"],
            section: "basic",
            slug: "escape",
            statistic: ["unarmed", "acrobatics", "athletics"],
            traits: ["attack"],
        });
    }

    protected override toActionVariant(data?: SingleCheckActionVariantData): EscapeActionVariant {
        return new EscapeActionVariant(this, data);
    }
}

const action = new EscapeAction();

export { action, escape as legacy };
