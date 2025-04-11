import type { ActorAvant } from "@actor";
import type { EffectAvant } from "@item";
import { getSelectedActors } from "@util/token-actor-utils.ts";
import { BaseAction, BaseActionData, BaseActionVariant, BaseActionVariantData } from "./base.ts";
import { ActionCost, ActionUseOptions } from "./types.ts";

interface SimpleActionVariantData extends BaseActionVariantData {
    effect?: string | EffectAvant;
}

interface SimpleActionData extends BaseActionData<SimpleActionVariantData> {
    effect?: string | EffectAvant;
}

interface SimpleActionUseOptions extends ActionUseOptions {
    cost: ActionCost;
    effect: string | EffectAvant | false;
}

interface SimpleActionResult {
    actor: ActorAvant;
    effect?: EffectAvant;
    message?: ChatMessage;
}

async function toEffectItem(effect?: string | EffectAvant) {
    return typeof effect === "string" ? await fromUuid(effect) : effect;
}

class SimpleActionVariant extends BaseActionVariant {
    readonly #action: SimpleAction;
    readonly #effect?: string | EffectAvant;

    constructor(action: SimpleAction, data?: SimpleActionVariantData) {
        super(action, data);
        this.#action = action;
        this.#effect = data?.effect ?? action.effect;
    }

    get effect(): string | EffectAvant | undefined {
        return this.#effect ?? this.#action.effect;
    }

    override async use(options: Partial<SimpleActionUseOptions> = {}): Promise<SimpleActionResult[]> {
        const actors: ActorAvant[] = [];
        if (Array.isArray(options.actors)) {
            actors.push(...options.actors);
        } else if (options.actors) {
            actors.push(options.actors);
        } else {
            actors.push(...getSelectedActors({ exclude: ["loot", "party"], assignedFallback: true }));
        }
        if (actors.length === 0) {
            throw new Error(game.i18n.localize("AVANT.ActionsWarning.NoActor"));
        }

        const traitLabels: Record<string, string | undefined> = CONFIG.AVANT.actionTraits;
        const traitDescriptions: Record<string, string | undefined> = CONFIG.AVANT.traitsDescriptions;
        const traits = this.traits.concat(options.traits ?? []).map((trait) => ({
            description: traitDescriptions[trait],
            label: traitLabels[trait] ?? trait,
            slug: trait,
        }));
        const effect = options?.effect === false ? undefined : await toEffectItem(options?.effect ?? this.effect);
        const name = this.name
            ? `${game.i18n.localize(this.#action.name)} - ${game.i18n.localize(this.name)}`
            : game.i18n.localize(this.#action.name);
        const flavor = await renderTemplate("systems/avant/templates/actors/actions/simple/chat-message-flavor.hbs", {
            effect,
            glyph: this.glyph,
            name,
            traits,
        });
        const results: SimpleActionResult[] = [];
        for (const actor of actors) {
            const data = {
                flavor,
                speaker: ChatMessage.getSpeaker({ actor }),
            };
            const message = (options.message?.create ?? true) ? await ChatMessage.create(data) : new ChatMessage(data);
            const item =
                effect && actor.isOwner
                    ? ((await actor.createEmbeddedDocuments("Item", [effect.toObject()]))[0] as EffectAvant)
                    : undefined;
            results.push({ actor, effect: item, message });
        }
        return results;
    }
}

class SimpleAction extends BaseAction<SimpleActionVariantData, SimpleActionVariant> {
    readonly effect?: string | EffectAvant;

    public constructor(data: SimpleActionData) {
        super(data);
        this.effect = data.effect;
    }

    protected override toActionVariant(data?: SimpleActionVariantData): SimpleActionVariant {
        return new SimpleActionVariant(this, data);
    }
}

export { SimpleAction, SimpleActionVariant };
export type { SimpleActionResult, SimpleActionUseOptions, SimpleActionVariantData };
