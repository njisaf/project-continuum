import type { AbilityItemAvant } from "@item/ability/document.ts";
import { ItemSheetDataAvant, ItemSheetOptions, ItemSheetAvant } from "@item/base/sheet/sheet.ts";
import { getItemFromDragEvent } from "@module/sheet/helpers.ts";
import { ancestryTraits } from "@scripts/config/traits.ts";
import { ErrorAvant } from "@util";
import * as R from "remeda";
import type { AbilitySystemSchema, SelfEffectReference } from "./data.ts";
import { activateActionSheetListeners, createSelfEffectSheetData, handleSelfEffectDrop } from "./helpers.ts";

// Gather traits to restrict to avoid trait selection noise in the selection
// We fetch at load time to avoid propagated homebrew traits
const originalAncestryTraits = R.keys(ancestryTraits);

class AbilitySheetAvant extends ItemSheetAvant<AbilityItemAvant> {
    static override get defaultOptions(): ItemSheetOptions {
        return {
            ...super.defaultOptions,
            dragDrop: [{ dropSelector: ".tab[data-tab=details]" }],
            hasSidebar: true,
        };
    }

    protected override get validTraits(): Record<string, string> {
        return R.omit(this.item.constructor.validTraits, [
            ...originalAncestryTraits,
            "archetype",
            "cantrip",
            "class",
            "dedication",
            "focus",
            "general",
            "skill",
            "summoned",
        ] as const);
    }

    override async getData(options: Partial<ItemSheetOptions> = {}): Promise<ActionSheetData> {
        const sheetData = await super.getData(options);

        return {
            ...sheetData,
            fields: this.item.system.schema.fields,
            actionTypes: CONFIG.AVANT.actionTypes,
            actionsNumber: CONFIG.AVANT.actionsNumber,
            actionTraits: CONFIG.AVANT.actionTraits,
            frequencies: CONFIG.AVANT.frequencies,
            proficiencies: CONFIG.AVANT.proficiencyLevels,
            selfEffect: createSelfEffectSheetData(sheetData.data.selfEffect),
        };
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery<HTMLElement>): void {
        super.activateListeners($html);
        if (!this.isEditable) return;

        const html = $html[0];
        activateActionSheetListeners(this.item, html);
    }

    override async _onDrop(event: DragEvent): Promise<void> {
        const item = await getItemFromDragEvent(event);
        if (!item) return;

        if (!(await handleSelfEffectDrop(this, item))) {
            throw ErrorAvant("Invalid item drop");
        }
    }
}

interface ActionSheetData extends ItemSheetDataAvant<AbilityItemAvant> {
    fields: AbilitySystemSchema;
    actionTypes: typeof CONFIG.AVANT.actionTypes;
    actionsNumber: typeof CONFIG.AVANT.actionsNumber;
    actionTraits: typeof CONFIG.AVANT.actionTraits;
    frequencies: typeof CONFIG.AVANT.frequencies;
    proficiencies: typeof CONFIG.AVANT.proficiencyLevels;
    selfEffect: SelfEffectReference | null;
}

export { AbilitySheetAvant };
