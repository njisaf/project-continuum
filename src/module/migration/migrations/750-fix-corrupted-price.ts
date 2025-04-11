import { ItemSourceAvant } from "@item/base/data/index.ts";
import { itemIsOfType } from "@item/helpers.ts";
import { CoinsAvant } from "@item/physical/helpers.ts";
import { MigrationBase } from "../base.ts";

export class Migration750FixCorruptedPrice extends MigrationBase {
    static override version = 0.75;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (!itemIsOfType(source, "physical") && source.type !== "kit") return;

        if (typeof source.system.price === "string") {
            source.system.price = { value: CoinsAvant.fromString(source.system.price).toObject() };
        }
    }
}
