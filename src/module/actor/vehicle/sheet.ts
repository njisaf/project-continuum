import { AbilityViewData, ActorSheetDataAvant } from "@actor/sheet/data-types.ts";
import { createAbilityViewData } from "@actor/sheet/helpers.ts";
import { VehicleAvant } from "@actor/vehicle/index.ts";
import { ItemAvant } from "@item";
import { AdjustedValue, getAdjustedValue } from "@module/sheet/helpers.ts";
import { ErrorAvant, getActionIcon, htmlClosest, htmlQuery, htmlQueryAll } from "@util";
import { ActorSheetAvant } from "../sheet/base.ts";

export class VehicleSheetAvant extends ActorSheetAvant<VehicleAvant> {
    static override get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "vehicle"],
            width: 670,
            height: 480,
            tabs: [{ navSelector: ".sheet-navigation", contentSelector: ".sheet-content", initial: "details" }],
            template: "systems/avant/templates/actors/vehicle/sheet.hbs",
        };
    }

    override async getData(): Promise<VehicleSheetData> {
        const sheetData = await super.getData();

        const actions: ActionsSheetData = {
            action: { label: game.i18n.localize("AVANT.ActionsActionsHeader"), actions: [] },
            reaction: { label: game.i18n.localize("AVANT.ActionsReactionsHeader"), actions: [] },
            free: { label: game.i18n.localize("AVANT.ActionsFreeActionsHeader"), actions: [] },
        };

        for (const item of this.actor.itemTypes.action.toSorted((a, b) => a.sort - b.sort)) {
            const actionType = item.actionCost?.type ?? "free";
            actions[actionType].actions.push({
                ...createAbilityViewData(item),
                img: ((): ImageFilePath => {
                    const actionIcon = getActionIcon(item.actionCost);
                    const defaultIcon = ItemAvant.getDefaultArtwork(item._source).img;
                    if (item.isOfType("action") && ![actionIcon, defaultIcon].includes(item.img)) {
                        return item.img;
                    }
                    return item.system.selfEffect?.img ?? actionIcon;
                })(),
            });
        }

        return {
            ...sheetData,
            actions,
            actorSizes: CONFIG.AVANT.actorSizes,
            actorSize: CONFIG.AVANT.actorSizes[this.actor.size],
            actorRarities: CONFIG.AVANT.rarityTraits,
            actorRarity: CONFIG.AVANT.rarityTraits[this.actor.system.traits.rarity],
            ac: getAdjustedValue(this.actor.attributes.ac.value, this.actor._source.system.attributes.ac.value),
            frequencies: CONFIG.AVANT.frequencies,
            saves: {
                fortitude: getAdjustedValue(
                    this.actor.saves.fortitude.mod,
                    this.actor._source.system.saves.fortitude.value,
                ),
            },
            emitsSoundOptions: [
                { value: "true", label: "AVANT.Actor.Hazard.EmitsSound.True" },
                { value: "false", label: "AVANT.Actor.Hazard.EmitsSound.False" },
                { value: "encounter", label: "AVANT.Actor.Hazard.EmitsSound.Encounter" },
            ],
        };
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        // Ensure correct tab name is displayed after actor update
        const titleElem = htmlQuery(html, "nav > .panel-title");
        if (!titleElem) throw ErrorAvant("Unexpected missing DOM element");

        const initialTitle = htmlQuery(html, ".sheet-navigation .active")?.title;
        if (initialTitle) titleElem.title = initialTitle;

        for (const element of htmlQueryAll(html, ".sheet-navigation .item")) {
            element.addEventListener("mouseover", () => {
                titleElem.textContent = element.title;
            });

            element.addEventListener("mouseout", () => {
                const parent = htmlClosest(element, ".sheet-navigation");
                const title = htmlQuery(parent, ".item.active")?.title;
                if (title) titleElem.textContent = title;
            });
        }
    }

    protected override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        // Change emitsSound values of "true" and "false" to booleans
        const emitsSound = formData["system.attributes.emitsSound"];
        if (emitsSound !== "encounter") {
            formData["system.attributes.emitsSound"] = emitsSound === "true";
        }

        return super._updateObject(event, formData);
    }
}

interface VehicleSheetData extends ActorSheetDataAvant<VehicleAvant> {
    actions: ActionsSheetData;
    actorRarities: typeof CONFIG.AVANT.rarityTraits;
    actorRarity: string;
    actorSizes: typeof CONFIG.AVANT.actorSizes;
    actorSize: string;
    ac: AdjustedValue;
    frequencies: typeof CONFIG.AVANT.frequencies;
    saves: { fortitude: AdjustedValue };
    emitsSoundOptions: FormSelectOption[];
}

type ActionsSheetData = Record<"action" | "reaction" | "free", { label: string; actions: AbilityViewData[] }>;
