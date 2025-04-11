import { ItemSheetOptions } from "@item/base/sheet/sheet.ts";
import { PhysicalItemSheetData, PhysicalItemSheetAvant } from "@item/physical/index.ts";
import * as R from "remeda";
import type { TreasureAvant } from "./document.ts";

export class TreasureSheetAvant extends PhysicalItemSheetAvant<TreasureAvant> {
    override async getData(options?: Partial<ItemSheetOptions>): Promise<TreasureSheetData> {
        return {
            ...(await super.getData(options)),
            currencies: CONFIG.AVANT.currencies,
            stackGroups: R.pick(CONFIG.AVANT.stackGroups, ["coins", "gems"]),
        };
    }

    protected override _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        if (formData["system.stackGroup"] === "") {
            formData["system.stackGroup"] = null;
        }

        return super._updateObject(event, formData);
    }
}

interface TreasureSheetData extends PhysicalItemSheetData<TreasureAvant> {
    currencies: ConfigAvant["AVANT"]["currencies"];
    stackGroups: Pick<typeof CONFIG.AVANT.stackGroups, "coins" | "gems">;
}
