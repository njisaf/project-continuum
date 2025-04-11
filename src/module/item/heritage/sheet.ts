import { AncestryAvant, ItemAvant, type HeritageAvant } from "@item";
import { ItemSheetDataAvant, ItemSheetOptions, ItemSheetAvant } from "@item/base/sheet/sheet.ts";
import { ErrorAvant, sluggify } from "@util";

export class HeritageSheetAvant extends ItemSheetAvant<HeritageAvant> {
    static override get defaultOptions(): ItemSheetOptions {
        return {
            ...super.defaultOptions,
            dragDrop: [{ dropSelector: ".sidebar" }],
            hasSidebar: true,
        };
    }

    override async getData(options?: Partial<ItemSheetOptions>): Promise<HeritageSheetData> {
        const sheetData = await super.getData(options);

        const ancestry = await (async (): Promise<AncestryAvant | null> => {
            const item = this.item.system.ancestry ? await fromUuid(this.item.system.ancestry.uuid) : null;
            return item instanceof AncestryAvant ? item : null;
        })();

        return {
            ...sheetData,
            ancestry,
            ancestryRefBroken: !!sheetData.data.ancestry && ancestry === null,
        };
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);

        // Remove ancestry reference
        $html.find('a[data-action="remove-ancestry"]').on("click", () => {
            this.item.update({ "system.ancestry": null });
        });
    }

    override async _onDrop(event: DragEvent): Promise<void> {
        const item = await (async (): Promise<ItemAvant | null> => {
            try {
                const dataString = event.dataTransfer?.getData("text/plain");
                const dropData = JSON.parse(dataString ?? "");
                return (await ItemAvant.fromDropData(dropData)) ?? null;
            } catch {
                return null;
            }
        })();
        if (!(item instanceof AncestryAvant)) {
            throw ErrorAvant("Invalid item drop on heritage sheet");
        }

        const ancestryReference = {
            name: item.name,
            slug: item.slug ?? sluggify(item.name),
            uuid: item.uuid,
        };

        await this.item.update({ "system.ancestry": ancestryReference });
    }
}

interface HeritageSheetData extends ItemSheetDataAvant<HeritageAvant> {
    ancestry: AncestryAvant | null;
    ancestryRefBroken: boolean;
}
