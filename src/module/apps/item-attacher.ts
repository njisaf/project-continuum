import type { PhysicalItemAvant } from "@item";
import { PickAThingPrompt, PickableThing } from "@module/apps/pick-a-thing-prompt.ts";
import { RollNoteAvant } from "@module/notes.ts";
import { StatisticRollParameters } from "@system/statistic/statistic.ts";
import { ErrorAvant } from "@util";

/** A prompt for the user to select an item to receive an attachment */
class ItemAttacher<TItem extends PhysicalItemAvant> extends PickAThingPrompt<TItem, PhysicalItemAvant> {
    static override get defaultOptions(): ApplicationOptions {
        return {
            ...super.defaultOptions,
            template: "systems/avant/templates/items/item-attacher.hbs",
        };
    }

    constructor({ item }: { item: TItem }) {
        if (!item.isAttachable) {
            throw ErrorAvant("Not an attachable item");
        }
        const collection =
            item.actor?.inventory.contents ??
            game.items.filter((i): i is PhysicalItemAvant<null> => i.isOfType("physical"));
        const choices = collection
            .filter((i) => i.quantity > 0 && i.acceptsSubitem(item))
            .map((i) => ({ value: i, img: i.img, label: i.name }))
            .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

        super({ item, choices });
    }

    /** Only allow one of these dialogs to be open. */
    override get id(): string {
        return "item-attacher";
    }

    override get title(): string {
        return game.i18n.format("AVANT.Item.Physical.Attach.PromptTitle", { item: this.item.name });
    }

    protected override getSelection(event: MouseEvent): PickableThing<PhysicalItemAvant> | null {
        const selection = super.getSelection(event);
        if (selection) this.#attach(selection.value);
        return selection;
    }

    override async resolveSelection(): Promise<PickableThing<PhysicalItemAvant> | null> {
        if (this.choices.length === 0) {
            const locKey = "AVANT.Item.Physical.Attach.NoEligibleItem";
            const message = game.i18n.format(locKey, { attachable: this.item.name });
            ui.notifications.warn(message);
            return null;
        }

        return super.resolveSelection();
    }

    override activateListeners($html: JQuery<HTMLElement>): void {
        super.activateListeners($html);
        const html = $html[0];

        const attachButton = html.querySelector<HTMLButtonElement>("button[data-action=pick]");
        const selectEl = html.querySelector<HTMLSelectElement>("select[data-choices]");
        if (!(attachButton && selectEl)) {
            throw ErrorAvant("Unexpected error adding listeners to item attacher");
        }

        selectEl.addEventListener("change", () => {
            attachButton.value = selectEl.value;
        });
    }

    /**
     * Attach the attachment to the target item. If a crafting check is requesting, attempt it first and abort on
     * failure.
     */
    async #attach(attachmentTarget: PhysicalItemAvant): Promise<boolean> {
        const checkRequested =
            !!this.element[0]?.querySelector<HTMLInputElement>("input[data-crafting-check]")?.checked;
        if (checkRequested && !(await this.#craftingCheck(attachmentTarget))) return false;

        const targetSource = attachmentTarget.toObject();
        if (!targetSource.system.subitems) {
            throw ErrorAvant("This item does not accept attachments");
        }
        const subitems = targetSource.system.subitems;
        const attachmentSource = this.item.toObject();
        attachmentSource.system.quantity = 1;
        attachmentSource.system.equipped = { carryType: "attached", handsHeld: 0 };
        if (subitems.some((s) => s._id === attachmentSource._id)) {
            attachmentSource._id = fu.randomID();
        }
        subitems.push(attachmentSource);

        const newQuantity = this.item.quantity - 1;
        const updated = await Promise.all([
            newQuantity <= 0 ? this.item.delete() : this.item.update({ "system.quantity": newQuantity }),
            attachmentTarget.update({ "system.subitems": subitems }),
        ]);

        return updated.every((u) => !!u);
    }

    async #craftingCheck(attachmentTarget: PhysicalItemAvant): Promise<boolean> {
        const statistic = this.actor?.skills?.crafting;
        if (!statistic) throw ErrorAvant("Item not owned by a creature");

        const dc = { value: 10, visible: true };
        const args: StatisticRollParameters = {
            dc,
            label: await renderTemplate("systems/avant/templates/chat/action/header.hbs", {
                glyph: null,
                subtitle: game.i18n.format("AVANT.ActionsCheck.x", { type: statistic.label }),
                title: this.title,
            }),
            extraRollNotes: [
                new RollNoteAvant({
                    outcome: ["failure", "criticalFailure"],
                    selector: "crafting-check",
                    text: game.i18n.format("AVANT.Item.Physical.Attach.Outcome.Failure", { attachable: this.item.name }),
                    title: "AVANT.Check.Result.Degree.Check.failure",
                }),
                new RollNoteAvant({
                    outcome: ["success", "criticalSuccess"],
                    selector: "crafting-check",
                    text: game.i18n.format("AVANT.Item.Physical.Attach.Outcome.Success", {
                        attachable: this.item.name,
                        target: attachmentTarget.name,
                    }),
                    title: "AVANT.Check.Result.Degree.Check.success",
                }),
            ],
        };
        const roll = await statistic.roll(args);

        return (roll?.total ?? 0) >= dc.value;
    }
}

export { ItemAttacher };
