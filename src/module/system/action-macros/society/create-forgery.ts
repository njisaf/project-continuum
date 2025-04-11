import { ActionMacroHelpers, SkillActionOptions } from "../index.ts";
import { CheckResultCallback } from "@system/action-macros/types.ts";
import { CreatureAvant } from "@actor";
import { RawModifier, ModifierAvant } from "@actor/modifiers.ts";
import {
    SingleCheckAction,
    SingleCheckActionUseOptions,
    SingleCheckActionVariant,
    SingleCheckActionVariantData,
} from "@actor/actions/index.ts";

interface ChatMessageCheckFlags {
    context: {
        options: string[];
    };
    modifiers: RawModifier[];
}

async function createForgeryCallback(
    result: CheckResultCallback,
    callback?: (result: CheckResultCallback) => void,
): Promise<void> {
    // consider any modifiers enabled in the roll dialog
    const societyDC = (() => {
        if (result.actor instanceof CreatureAvant) {
            const systemFlags = result.message?.flags.avant as unknown as ChatMessageCheckFlags;
            const modifiers = (systemFlags.modifiers as RawModifier[])
                .filter((modifier) => modifier.enabled)
                .map((modifier) => {
                    return { ...modifier, predicate: [] };
                })
                .map((modifier) => new ModifierAvant(modifier));
            return result.actor.skills.society
                .extend({
                    slug: result.actor.skills.society.slug,
                    modifiers,
                })
                .withRollOptions({
                    extraRollOptions: systemFlags.context.options,
                    origin: result.actor,
                }).dc;
        }
        return null;
    })();
    const gmNotes = (() => {
        if (["criticalSuccess", "success"].includes(result.outcome ?? "")) {
            return game.i18n.format("AVANT.Actions.CreateForgery.ForgedDocument.SuccessGmNote", {
                societyDC: societyDC?.value ?? null,
            });
        } else if (["criticalFailure", "failure"].includes(result.outcome ?? "")) {
            return game.i18n.format("AVANT.Actions.CreateForgery.ForgedDocument.FailureGmNote", {
                failure: game.i18n.localize("AVANT.Actions.CreateForgery.Notes.failure"),
                success: game.i18n.localize("AVANT.Actions.CreateForgery.Notes.success"),
                total: result.roll.total,
            });
        }
        return "";
    })();

    // create forged document item
    await Item.create(
        {
            img: "systems/avant/icons/equipment/adventuring-gear/scroll-case.webp",
            name: game.i18n.localize("AVANT.Actions.CreateForgery.ForgedDocument.Name"),
            type: "equipment",
            system: {
                description: {
                    gm: gmNotes,
                    value: game.i18n.format("AVANT.Actions.CreateForgery.ForgedDocument.Description", {
                        societyDC: societyDC?.value ?? null,
                    }),
                },
            },
        },
        {
            parent: result.actor,
        },
    );

    // remind user that an item was created in the actor's inventory
    const notification = game.i18n.format("AVANT.Actions.CreateForgery.ForgedDocumentCreatedNotification", {
        name: result.actor.name,
    });
    ui.notifications.info(notification);

    callback?.(result);
}

function createForgery(options: SkillActionOptions): Promise<void> {
    const modifiers = [
        new ModifierAvant({
            label: "AVANT.Actions.CreateForgery.UnspecificHandwriting",
            modifier: 4,
            predicate: ["action:create-forgery:unspecific-handwriting"],
            type: "circumstance",
        }),
    ].concat(options?.modifiers ?? []);
    const slug = options?.skill ?? "society";
    const rollOptions = ["action:create-forgery"];
    return ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.CreateForgery.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["downtime", "secret"],
        event: options.event,
        callback: async (result: CheckResultCallback) => createForgeryCallback(result, options?.callback),
        difficultyClass: options.difficultyClass ?? { value: 20 },
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.CreateForgery", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.CreateForgery", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.CreateForgery", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.CreateForgery", "criticalFailure"),
        ],
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

class CreateForgeryActionVariant extends SingleCheckActionVariant {
    override async use(options: Partial<SingleCheckActionUseOptions> = {}): Promise<CheckResultCallback[]> {
        return super.use(options).then(async (results) => {
            for (const result of results) {
                await createForgeryCallback(result);
            }
            return results;
        });
    }
}

class CreateForgeryAction extends SingleCheckAction {
    constructor() {
        super({
            description: "AVANT.Actions.CreateForgery.Description",
            difficultyClass: {
                value: 20,
            },
            img: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
            modifiers: [
                {
                    label: "AVANT.Actions.CreateForgery.UnspecificHandwriting",
                    modifier: 4,
                    predicate: ["action:create-forgery:unspecific-handwriting"],
                    type: "circumstance",
                },
            ],
            name: "AVANT.Actions.CreateForgery.Title",
            notes: [
                { outcome: ["criticalSuccess"], text: "AVANT.Actions.CreateForgery.Notes.criticalSuccess" },
                { outcome: ["success"], text: "AVANT.Actions.CreateForgery.Notes.success" },
                { outcome: ["failure"], text: "AVANT.Actions.CreateForgery.Notes.failure" },
                { outcome: ["criticalFailure"], text: "AVANT.Actions.CreateForgery.Notes.criticalFailure" },
            ],
            rollOptions: ["action:create-forgery"],
            section: "skill",
            slug: "create-forgery",
            statistic: "society",
            traits: ["downtime", "secret"],
        });
    }

    protected override toActionVariant(data?: SingleCheckActionVariantData): SingleCheckActionVariant {
        return new CreateForgeryActionVariant(this, data);
    }
}

const action = new CreateForgeryAction();

export { createForgery as legacy, action };
