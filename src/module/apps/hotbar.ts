import { ItemAvant } from "@item";
import { MacroAvant } from "@module/macro.ts";
import { createActionMacro, createToggleEffectMacro } from "@scripts/macros/hotbar.ts";
import { ErrorAvant, htmlClosest, isObject } from "@util";

class HotbarAvant extends Hotbar<MacroAvant> {
    /** Handle macro creation from non-macros */
    override async _onDrop(event: DragEvent): Promise<void> {
        const li = htmlClosest(event.target, ".macro");
        const slot = Number(li?.dataset.slot) || null;
        if (!slot) return;

        const data: HotbarDropData = TextEditor.getDragEventData(event);
        if (!["Item", "RollOption", "Action"].includes(data.type ?? "")) {
            return super._onDrop(event);
        }
        if (Hooks.call("hotbarDrop", this, data, slot) === false) return;

        // A melee item dropped on the hotbar is to instead generate an action macro
        if (data.type === "Item" && data.itemType === "melee" && typeof data.index === "number") {
            data.type = "Action";
        }

        switch (data.type) {
            case "Item": {
                const itemId = data.id ?? (isObject<{ _id?: unknown }>(data.data) ? data.data._id : null);
                const uuid = data.uuid;

                const prefix =
                    typeof data.pack === "string"
                        ? `Compendium.${data.pack}`
                        : typeof data.actorId === "string"
                          ? `Actor.${data.actorId}.Item`
                          : "Item";
                const item = await fromUuid(uuid ?? `${prefix}.${itemId}`);
                if (!(item instanceof ItemAvant)) return;

                if (item.isOfType("condition", "effect")) {
                    return createToggleEffectMacro(item, slot);
                } else if (uuid?.startsWith("Compendium.")) {
                    ui.notifications.error("AVANT.Macro.NoCompendiumItem", { localize: true });
                    return;
                } else {
                    return HotbarAvant.#createItemMacro(item, slot);
                }
            }
            case "RollOption": {
                const item = fromUuidSync(data.uuid ?? "");
                if (!(item instanceof ItemAvant && item.isEmbedded)) {
                    throw ErrorAvant("Unexpected error during macro creation");
                }
                if (!this.#hasRollOptionData(data)) return;
                return HotbarAvant.#createRollOptionToggleMacro({ ...data, item }, slot);
            }
            case "Action": {
                if (typeof data.index !== "number" && !data.elementTrait) return;
                return createActionMacro({
                    actorUUID: data.actorUUID,
                    actionIndex: data.index,
                    slot,
                    elementTrait: data.elementTrait,
                });
            }
        }
    }

    #hasRollOptionData(data: Record<string, unknown>): data is RollOptionData {
        const { label, domain, option } = data;
        return (
            typeof label === "string" &&
            label.length > 0 &&
            typeof domain === "string" &&
            domain.length > 0 &&
            typeof option === "string" &&
            option.length > 0
        );
    }

    /**
     * Create a Macro from an Item drop.
     * Get an existing item macro if one exists, otherwise create a new one.
     * @param item     The item data
     * @param slot     The hotbar slot to use
     */
    static async #createItemMacro(item: ItemAvant, slot: number): Promise<void> {
        const isLinked = !!item.actor?.prototypeToken.actorLink;
        const command = `game.avant.rollItemMacro("${isLinked ? item.uuid : item.id}", event);`;
        const macro =
            game.macros.find((m) => m.name === item.name && m.command === command) ??
            (await MacroAvant.create(
                {
                    command,
                    name: item.name,
                    type: "script",
                    img: item.img,
                    flags: { avant: { itemMacro: true } },
                },
                { renderSheet: false },
            ));
        game.user.assignHotbarMacro(macro ?? null, slot);
    }

    static async #createRollOptionToggleMacro(
        data: Pick<RollOptionData, "label" | "domain" | "option"> & { item: ItemAvant },
        slot: number,
    ): Promise<void> {
        const name = game.i18n.format("AVANT.ToggleWithName", { property: data.label });
        const escapedName = new Handlebars.SafeString(data.label);
        const { item, domain, option } = data;
        const command = `const item = fromUuidSync("${item.uuid}");
if (!(item instanceof Item && item.isEmbedded && item.isOwner)) {
    ui.notifications.error("AVANT.MacroActionNoActorError", { localize: true });
}
const result = await item.actor.toggleRollOption("${domain}", "${option}", "${item.id}");
const state = game.i18n.localize(result ? "AVANT.Macro.OptionToggle.On" : "AVANT.Macro.OptionToggle.Off");
const message = game.i18n.format("AVANT.Macro.OptionToggle.Notification", { toggle: "${escapedName}", state });
if (typeof result === "boolean") {
    ui.notifications.info(message);
}`;

        const toggleMacro =
            game.macros.find((m) => m.name === name && m.command === command) ??
            (await MacroAvant.create({ type: "script", name, img: item.img, command }, { renderSheet: false })) ??
            null;

        await game.user.assignHotbarMacro(toggleMacro, slot);
    }
}

type HotbarDropData = Partial<DropCanvasData> & {
    actorId?: string;
    actorUUID?: ActorUUID;
    slot?: number;
    skill?: string;
    skillName?: string;
    index?: number;
    itemType?: string;
    elementTrait?: string;
    avant?: {
        type: string;
        property: string;
        label: string;
    };
};

type RollOptionData = {
    label: string;
    domain: string;
    option: string;
};

export { HotbarAvant };
