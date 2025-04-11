import { renderCraftingInline } from "@actor/character/crafting/helpers.ts";
import { PhysicalItemAvant } from "@item";
import { ChatMessageAvant } from "@module/chat-message/index.ts";
import { calculateDC } from "@module/dc.ts";
import { CheckDC } from "@system/degree-of-success.ts";
import { ActionMacroHelpers } from "../helpers.ts";
import { SkillActionOptions } from "../types.ts";
import { SelectItemDialog } from "./select-item.ts";

export async function craft(options: CraftActionOptions): Promise<void> {
    // resolve item
    const item = options.item ?? (await (options.uuid ? fromUuid(options.uuid) : SelectItemDialog.getItem("craft")));

    // ensure item is a valid crafting target
    if (!item) {
        console.warn("Avant System | No item selected to craft: aborting");
        return;
    } else if (!(item instanceof PhysicalItemAvant)) {
        ui.notifications.warn(
            game.i18n.format("AVANT.Actions.Craft.Warning.NotPhysicalItem", { item: item.name ?? "" }),
        );
        return;
    }

    // check for sufficient proficiency in crafting skill
    // check that actor has the necessary feats to craft item

    const quantity = options.quantity ?? 1;

    // figure out DC from item
    const pwol = game.avant.settings.variants.pwol.enabled;
    const dc: CheckDC = options.difficultyClass ?? {
        value: calculateDC(item.level, { pwol }),
        visible: true,
    };

    // whether the player needs to pay crafting costs
    const free = !!options.free;

    const slug = options?.skill ?? "crafting";
    const rollOptions = ["action:craft"];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.Craft.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        traits: ["downtime", "manipulate"],
        event: options.event,
        difficultyClass: dc,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Craft", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Craft", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Craft", "failure"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Craft", "criticalFailure"),
        ],
        createMessage: false,
        callback: async (result) => {
            // react to check result, creating the item in the actor's inventory on a success
            if (result.message instanceof ChatMessageAvant) {
                const message = result.message;
                const flavor = await (async () => {
                    if (["criticalSuccess", "success", "criticalFailure"].includes(result.outcome ?? "")) {
                        return await renderCraftingInline(item, result.roll, quantity, result.actor, free, slug);
                    }
                    return "";
                })();
                if (flavor) {
                    message.updateSource({ flavor: message.flavor + flavor });
                }
                ChatMessage.create(message.toObject());
            } else {
                console.error("AVANT | Unable to amend chat message with craft result.", result.message);
            }
            options.callback?.(result);
        },
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

interface CraftActionOptions extends SkillActionOptions {
    difficultyClass?: CheckDC;
    item?: PhysicalItemAvant;
    quantity?: number;
    uuid?: string;
    free?: boolean;
}
