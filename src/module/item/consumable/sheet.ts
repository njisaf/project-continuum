import { ItemSheetOptions } from "@item/base/sheet/sheet.ts";
import { PhysicalItemSheetData, PhysicalItemSheetAvant } from "@item/physical/index.ts";
import { SheetOptions, createSheetTags } from "@module/sheet/helpers.ts";
import { DamageType } from "@system/damage/index.ts";
import { sortStringRecord } from "@util";
import * as R from "remeda";
import type { ConsumableAvant } from "./document.ts";
import { ConsumableCategory } from "./types.ts";
import { DAMAGE_OR_HEALING_CONSUMABLE_CATEGORIES } from "./values.ts";

class ConsumableSheetAvant extends PhysicalItemSheetAvant<ConsumableAvant> {
    override async getData(options?: Partial<ItemSheetOptions>): Promise<ConsumableSheetData> {
        const sheetData = await super.getData(options);
        const item = this.item;
        const canHaveDamageOrHealing = DAMAGE_OR_HEALING_CONSUMABLE_CATEGORIES.has(item.category);
        const canHaveHealing =
            canHaveDamageOrHealing &&
            item.system.category !== "snare" &&
            !!item.system.damage &&
            ["vitality", "void", "untyped"].includes(item.system.damage.type);

        return {
            ...sheetData,
            canHaveDamageOrHealing,
            canHaveHealing,
            categories: sortStringRecord(CONFIG.AVANT.consumableCategories),
            damageTypes: sortStringRecord(CONFIG.AVANT.damageTypes),
            damageKindOptions: [
                { value: "damage", label: "AVANT.DamageLabel" },
                { value: "healing", label: "AVANT.TraitHealing" },
            ],
            materialEffects: createSheetTags(CONFIG.AVANT.materialDamageEffects, item.system.material.effects),
            otherTags: createSheetTags(CONFIG.AVANT.otherConsumableTags, item.system.traits.otherTags),
            stackGroups: this.item.isAmmo ? R.omit(CONFIG.AVANT.stackGroups, ["coins", "gems"]) : null,
        };
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        html.querySelector("button[data-action=add-damage]")?.addEventListener("click", () => {
            this.item.update({ "system.damage": { formula: "1d4", type: "untyped", kind: "damage" } });
        });

        html.querySelector("a[data-action=remove-damage]")?.addEventListener("click", () => {
            this.item.update({ "system.damage": null });
        });
    }

    protected override _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        if (formData["system.stackGroup"] === "") {
            formData["system.stackGroup"] = null;
        }

        return super._updateObject(event, formData);
    }
}

interface ConsumableSheetData extends PhysicalItemSheetData<ConsumableAvant> {
    canHaveDamageOrHealing: boolean;
    canHaveHealing: boolean;
    categories: Record<ConsumableCategory, string>;
    damageKindOptions: FormSelectOption[];
    damageTypes: Record<DamageType, string>;
    materialEffects: SheetOptions;
    otherTags: SheetOptions;
    stackGroups: Omit<typeof CONFIG.AVANT.stackGroups, "coins" | "gems"> | null;
}

export { ConsumableSheetAvant };
