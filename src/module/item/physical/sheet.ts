import { AutomaticBonusProgression as ABP } from "@actor/character/automatic-bonus-progression.ts";
import type { PhysicalItemAvant } from "@item";
import { ItemSheetDataAvant, ItemSheetOptions, ItemSheetAvant } from "@item/base/sheet/sheet.ts";
import { SheetOptions, createSheetTags, getAdjustment } from "@module/sheet/helpers.ts";
import { ErrorAvant, htmlClosest, htmlQuery, localizer, tupleHasValue } from "@util";
import * as R from "remeda";
import { detachSubitem } from "./helpers.ts";
import { CoinsAvant, ItemActivation, MaterialValuationData } from "./index.ts";
import { PRECIOUS_MATERIAL_GRADES } from "./values.ts";

class PhysicalItemSheetAvant<TItem extends PhysicalItemAvant> extends ItemSheetAvant<TItem> {
    static override get defaultOptions(): ItemSheetOptions {
        const options = super.defaultOptions;
        options.classes.push("physical");
        return { ...options, hasSidebar: true };
    }

    /** Show the identified data for editing purposes */
    override async getData(options?: Partial<ItemSheetOptions>): Promise<PhysicalItemSheetData<TItem>> {
        const sheetData = await super.getData(options);
        const { item } = this;

        const bulkAdjustment = getAdjustment(item.system.bulk.value, item._source.system.bulk.value, {
            better: "lower",
        });
        const basePrice = new CoinsAvant(item._source.system.price.value);
        const priceAdjustment = getAdjustment(item.system.price.value.copperValue, basePrice.copperValue);

        const { actionTraits } = CONFIG.AVANT;

        // Enrich content
        const rollData = { ...item.getRollData(), ...this.actor?.getRollData() };
        sheetData.enrichedContent.unidentifiedDescription = await TextEditor.enrichHTML(
            sheetData.item.system.identification.unidentified.data.description.value,
            { rollData },
        );
        const activations: PhysicalItemSheetData<TItem>["activations"] = [];
        for (const action of item.activations) {
            const description = await TextEditor.enrichHTML(action.description.value, { rollData });
            activations.push({
                action,
                id: action.id,
                base: `system.activations.${action.id}`,
                description,
                traits: createSheetTags(actionTraits, action.traits ?? { value: [] }),
            });
        }

        const adjustedLevelHint = ((): string | null => {
            const hintText = ABP.isEnabled(this.actor)
                ? "AVANT.Item.Weapon.FromABP"
                : "AVANT.Item.Weapon.FromMaterialAndRunes";
            const levelLabel =
                game.i18n.lang === "de"
                    ? game.i18n.localize("AVANT.LevelLabel")
                    : game.i18n.localize("AVANT.LevelLabel").toLocaleLowerCase(game.i18n.lang);
            return item.level !== item._source.system.level.value
                ? game.i18n.format(hintText, {
                      property: levelLabel,
                      value: item.level,
                  })
                : null;
        })();

        const adjustedPriceHint = (() => {
            if (!priceAdjustment) return null;
            const baseData = item._source;
            const basePrice = new CoinsAvant(baseData.system.price.value).scale(baseData.system.quantity).copperValue;
            const derivedPrice = item.assetValue.copperValue;
            const priceLabel =
                game.i18n.lang === "de"
                    ? game.i18n.localize("AVANT.PriceLabel")
                    : game.i18n.localize("AVANT.PriceLabel").toLocaleLowerCase(game.i18n.lang);
            return basePrice !== derivedPrice
                ? game.i18n.format(game.i18n.localize("AVANT.Item.Weapon.FromMaterialAndRunes"), {
                      property: priceLabel,
                      value: item.price.value.toString(),
                  })
                : null;
        })();

        const localizeBulk = localizer("AVANT.Item.Physical.Bulk");
        const bulks = [0, 0.1, ...Array.fromRange(50, 1)].map((value) => {
            if (value === 0) return { value, label: localizeBulk("Negligible.Label") };
            if (value === 0.1) return { value, label: localizeBulk("Light.Label") };
            return { value, label: value.toString() };
        });

        return {
            ...sheetData,
            itemType: game.i18n.localize("AVANT.ItemTitle"),
            sidebarTemplate: "systems/avant/templates/items/physical-sidebar.hbs",
            bulkAdjustment,
            adjustedLevelHint,
            basePrice,
            priceAdjustment,
            adjustedPriceHint,
            attributes: CONFIG.AVANT.abilities,
            actionTypes: CONFIG.AVANT.actionTypes,
            bulks,
            actionsNumber: CONFIG.AVANT.actionsNumber,
            frequencies: CONFIG.AVANT.frequencies,
            sizes: R.omit(CONFIG.AVANT.actorSizes, ["sm"]),
            usages: CONFIG.AVANT.usages,
            usageOptions: [
                { label: "0", value: "worngloves" },
                { label: "1", value: "held-in-one-hand" },
                { label: "1+", value: "held-in-one-plus-hands" },
                { label: "2", value: "held-in-two-hands" },
            ],
            identificationStatusOptions: [
                { label: "AVANT.identification.Identified", value: "identified" },
                { label: "AVANT.identification.Unidentified", value: "unidentified" },
            ],
            isApex: tupleHasValue(item._source.system.traits.value, "apex"),
            isPhysical: true,
            activations,
            // Do not let user set bulk if in a stack group because the group determines bulk
            bulkDisabled: !!sheetData.data?.stackGroup?.trim(),
        };
    }

    /** If the item is unidentified, prevent players from opening this sheet. */
    override render(force?: boolean, options?: RenderOptions): this {
        if (!this.item.isIdentified && !game.user.isGM) {
            ui.notifications.warn(this.item.description);
            return this;
        }

        return super.render(force, options);
    }

    protected getMaterialSheetData(item: PhysicalItemAvant, valuationData: MaterialValuationData): MaterialSheetData {
        const preciousMaterials: Record<string, string> = CONFIG.AVANT.preciousMaterials;
        const isSpecificMagicItem = item.isSpecific;
        const materials: MaterialSheetEntry[] = [
            { value: JSON.stringify({ type: null, grade: null }), label: "", group: "" }, // Initial empty value
        ];
        for (const [materialKey, materialData] of Object.entries(valuationData)) {
            const validGrades = [...PRECIOUS_MATERIAL_GRADES].filter(
                (grade) => !!materialData[grade] && (!isSpecificMagicItem || item.system.material.type === materialKey),
            );
            if (validGrades.length) {
                const group = game.i18n.localize(preciousMaterials[materialKey]);
                for (const grade of validGrades) {
                    const gradeLabel = game.i18n.localize(CONFIG.AVANT.preciousMaterialGrades[grade]);
                    const label = game.i18n.format("AVANT.Item.Weapon.MaterialAndRunes.MaterialOption", {
                        type: group,
                        grade: gradeLabel,
                    });
                    materials.push({
                        value: JSON.stringify({ type: materialKey, grade: grade }),
                        label,
                        group,
                    });
                }
            }
        }
        materials.sort((a, b) => a.group.localeCompare(b.group, game.i18n.lang));

        const value = JSON.stringify(R.pick(this.item.material, ["type", "grade"]));
        return { value, materials };
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery<HTMLElement>): void {
        super.activateListeners($html);
        const html = $html[0];

        // Subitem management
        htmlQuery(html, "ul[data-subitems]")?.addEventListener("click", async (event) => {
            const anchor = htmlClosest(event.target, "a[data-action]");
            if (!anchor) return;

            const item = this.item;
            const subitemId = htmlClosest(anchor, "[data-subitem-id]")?.dataset.subitemId;
            const subitem = item.subitems.get(subitemId, { strict: true });

            switch (anchor.dataset.action) {
                case "edit-subitem":
                    return subitem.sheet.render(true);
                case "detach-subitem":
                    return detachSubitem(subitem, event.ctrlKey);
                case "delete-subitem": {
                    return event.ctrlKey ? subitem.delete() : subitem.deleteDialog();
                }
                default:
                    throw ErrorAvant("Unexpected control options");
            }
        });
    }

    protected override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        // Process precious-material selection
        const [materialType, materialGrade] = [formData["system.material.type"], formData["system.material.grade"]];
        const typeIsValid =
            materialType === undefined ||
            (typeof materialType === "string" && materialType in CONFIG.AVANT.preciousMaterials);
        const gradeIsValid =
            materialGrade === undefined ||
            (typeof materialGrade === "string" && materialGrade in CONFIG.AVANT.preciousMaterialGrades);
        if (!typeIsValid || !gradeIsValid) {
            formData["system.material.type"] = null;
            formData["system.material.grade"] = null;
        }

        if (formData["system.baseItem"] === "") {
            formData["system.baseItem"] = null;
        }

        // Convert price from a string to an actual object
        if ("system.price.value" in formData) {
            formData["system.price.value"] = CoinsAvant.fromString(String(formData["system.price.value"]));
        }

        return super._updateObject(event, formData);
    }
}

interface PhysicalItemSheetData<TItem extends PhysicalItemAvant> extends ItemSheetDataAvant<TItem> {
    sidebarTemplate: string;
    isApex: boolean;
    isPhysical: true;
    bulkAdjustment: string | null;
    adjustedBulkHint?: string | null;
    adjustedLevelHint: string | null;
    basePrice: CoinsAvant;
    priceAdjustment: string | null;
    adjustedPriceHint: string | null;
    attributes: typeof CONFIG.AVANT.abilities;
    actionTypes: typeof CONFIG.AVANT.actionTypes;
    actionsNumber: typeof CONFIG.AVANT.actionsNumber;
    bulks: { value: number; label: string }[];
    frequencies: typeof CONFIG.AVANT.frequencies;
    sizes: Omit<typeof CONFIG.AVANT.actorSizes, "sm">;
    usages: typeof CONFIG.AVANT.usages;
    usageOptions: FormSelectOption[];
    identificationStatusOptions: FormSelectOption[];
    bulkDisabled: boolean;
    activations: {
        action: ItemActivation;
        id: string;
        base: string;
        description: string;
        traits: SheetOptions;
    }[];
}

interface MaterialSheetEntry {
    value: string;
    label: string;
    group: string;
}

interface MaterialSheetData {
    value: string;
    materials: MaterialSheetEntry[];
}

export { PhysicalItemSheetAvant };
export type { MaterialSheetData, MaterialSheetEntry, PhysicalItemSheetData };
