import { ItemSourceAvant } from "@item/base/data/index.ts";
import { MigrationBase } from "../base.ts";

/** Fix bulk of coins */
export class Migration911CoinBulk extends MigrationBase {
    static override version = 0.911;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type === "treasure" && source.system.stackGroup === "coins") {
            source.system.bulk.value = 1;
        }
    }
}
