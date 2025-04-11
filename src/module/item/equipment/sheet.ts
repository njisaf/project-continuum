import { ItemSheetOptions } from "@item/base/sheet/sheet.ts";
import { PhysicalItemSheetData, PhysicalItemSheetAvant } from "@item/physical/index.ts";
import { SheetOptions, createSheetTags } from "@module/sheet/helpers.ts";
import type { EquipmentAvant } from "./document.ts";

export class EquipmentSheetAvant extends PhysicalItemSheetAvant<EquipmentAvant> {
    override async getData(options?: Partial<ItemSheetOptions>): Promise<EquipmentSheetData> {
        const item = this.item;
        const sheetData = await super.getData(options);

        return {
            ...sheetData,
            otherTags: createSheetTags(CONFIG.AVANT.otherArmorTags, item.system.traits.otherTags),
        };
    }
}

interface EquipmentSheetData extends PhysicalItemSheetData<EquipmentAvant> {
    otherTags: SheetOptions;
}
