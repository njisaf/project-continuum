import { PhysicalItemAvant } from "@item";
import { htmlQuery, sluggify } from "@util";

class SelectItemDialog extends Application {
    #item: PhysicalItemAvant | null = null;

    #resolve: (value: PhysicalItemAvant | null) => void;

    #action: ItemAction;

    private constructor(action: ItemAction, resolve: (value: PhysicalItemAvant | null) => void) {
        super();
        this.#action = action;
        this.#resolve = resolve;
    }

    static override get defaultOptions(): ApplicationOptions {
        return { ...super.defaultOptions, width: 270 };
    }

    override get template(): string {
        return this.#action === "craft"
            ? "systems/avant/templates/system/actions/craft-target-item.hbs"
            : "systems/avant/templates/system/actions/repair/select-item-dialog.hbs";
    }

    override get title(): string {
        const key = sluggify(this.#action, { camel: "bactrian" });
        return game.i18n.localize(`AVANT.Actions.${key}.SelectItemDialog.Title`);
    }

    override async getData(options: Partial<ApplicationOptions> = {}): Promise<{ item: PhysicalItemAvant | null }> {
        options.classes = [`select-${this.#action}-item-dialog`];

        return {
            ...(await super.getData(options)),
            item: this.#item,
        };
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        html.addEventListener("drop", async (event) => {
            const json = event.dataTransfer?.getData("text/plain");
            if (!json?.startsWith("{") || !json.endsWith("}")) return;

            const data: Partial<ItemDropData> = JSON.parse(json);
            const uuid = data.uuid ?? data.avant?.itemUuid;
            const item = uuid ? await fromUuid(uuid) : null;

            if (this.#action === "repair" && item && !(item?.isEmbedded && item.isOwner)) {
                ui.notifications.error("DOCUMENT.UsePermissionWarn", { localize: true });
            } else if (item instanceof PhysicalItemAvant) {
                this.#item = item;
                this.render();
            } else {
                const key = sluggify(this.#action, { camel: "bactrian" });
                ui.notifications.error(game.i18n.localize(`AVANT.Actions.${key}.Error.ItemReferenceMismatch`));
            }
        });

        htmlQuery(html, `[data-event-handler=${this.#action}]`)?.addEventListener("click", () => {
            this.close();
        });

        htmlQuery(html, "[data-event-handler=cancel]")?.addEventListener("click", () => {
            this.#item = null;
            this.close();
        });
    }

    override close(options?: { force?: boolean }): Promise<void> {
        this.#resolve(this.#item);
        return super.close(options);
    }

    static async getItem(action: ItemAction): Promise<PhysicalItemAvant | null> {
        return new Promise((resolve) => {
            new this(action, resolve).render(true);
        });
    }
}

type ItemAction = "craft" | "repair";

interface ItemDropData {
    type: "Item";
    uuid?: string;
    avant?: { itemUuid?: string };
}

export { SelectItemDialog };
