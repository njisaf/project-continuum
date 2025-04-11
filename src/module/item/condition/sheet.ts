import { ItemSheetAvant } from "@item";
import type { ItemSheetOptions } from "@item/base/sheet/sheet.ts";
import type { ConditionAvant } from "./document.ts";

class ConditionSheetAvant extends ItemSheetAvant<ConditionAvant> {
    static override get defaultOptions(): ItemSheetOptions {
        return { ...super.defaultOptions, hasSidebar: true };
    }

    protected override get validTraits(): Record<string, string> {
        return {};
    }
}

export { ConditionSheetAvant };
