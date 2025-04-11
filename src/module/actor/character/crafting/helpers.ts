import type { ActorAvant, CharacterAvant } from "@actor";
import type { ConsumableAvant, PhysicalItemAvant, SpellAvant } from "@item";
import { ItemProxyAvant } from "@item";
import { createConsumableFromSpell } from "@item/consumable/spell-consumables.ts";
import { CoinsAvant } from "@item/physical/helpers.ts";
import { ChatMessageAvant } from "@module/chat-message/index.ts";
import { OneToTen } from "@module/data.ts";
import { getIncomeForLevel } from "@scripts/macros/earn-income/calculate.ts";
import { CheckRoll } from "@system/check/index.ts";
import { DegreeOfSuccess } from "@system/degree-of-success.ts";
import { fontAwesomeIcon } from "@util";

/** Implementation of Crafting rules on https://2e.aonprd.com/Actions.aspx?ID=43 */

interface Costs {
    reductionPerDay: CoinsAvant;
    materials: CoinsAvant;
    itemPrice: CoinsAvant;
    lostMaterials: CoinsAvant;
}

function calculateDaysToNoCost(costs: Costs): number {
    return Math.ceil((costs.itemPrice.copperValue - costs.materials.copperValue) / costs.reductionPerDay.copperValue);
}

async function prepStrings(costs: Costs, item: PhysicalItemAvant) {
    const rollData = item.getRollData();

    return {
        reductionPerDay: costs.reductionPerDay.toString(),
        materialCost: game.i18n.format("AVANT.Actions.Craft.Details.PayMaterials", {
            cost: costs.materials.toString(),
        }),
        itemCost: game.i18n.format("AVANT.Actions.Craft.Details.PayFull", {
            cost: costs.itemPrice.toString(),
        }),
        lostMaterials: game.i18n.format("AVANT.Actions.Craft.Details.LostMaterials", {
            cost: costs.lostMaterials.toString(),
        }),
        itemLink: await TextEditor.enrichHTML(item.link, { rollData }),
    };
}

function calculateCosts(
    item: PhysicalItemAvant,
    quantity: number,
    actor: CharacterAvant,
    degreeOfSuccess: number,
    skill: string = "crafting",
): Costs | null {
    const itemPrice = CoinsAvant.fromPrice(item.price, quantity);
    const materialCosts = itemPrice.scale(0.5);
    const lostMaterials = new CoinsAvant();
    const reductionPerDay = new CoinsAvant();

    const proficiency = actor.skills[skill]?.rank;
    if (!proficiency) return null;

    if (degreeOfSuccess === DegreeOfSuccess.CRITICAL_SUCCESS) {
        Object.assign(reductionPerDay, getIncomeForLevel(actor.level + 1).rewards[proficiency]);
    } else if (degreeOfSuccess === DegreeOfSuccess.SUCCESS) {
        Object.assign(reductionPerDay, getIncomeForLevel(actor.level).rewards[proficiency]);
    } else if (degreeOfSuccess === DegreeOfSuccess.CRITICAL_FAILURE) {
        Object.assign(lostMaterials, materialCosts.scale(0.1));
    }

    return {
        itemPrice: itemPrice,
        materials: materialCosts,
        lostMaterials: lostMaterials,
        reductionPerDay: reductionPerDay,
    };
}

export async function craftItem(
    item: PhysicalItemAvant,
    itemQuantity: number,
    actor: ActorAvant,
    infused?: boolean,
): Promise<void> {
    const itemSource = item.toObject();
    itemSource.system.quantity = itemQuantity;
    itemSource.system.size = actor.size === "tiny" ? "tiny" : "med";
    const itemTraits = item.traits;
    if (infused && itemTraits.has("alchemical") && itemTraits.has("consumable")) {
        const sourceTraits: string[] = itemSource.system.traits.value;
        sourceTraits.push("infused");
        itemSource.system.temporary = true;
    }
    const result = await actor.addToInventory(itemSource);
    if (!result) {
        ui.notifications.warn(game.i18n.localize("AVANT.Actions.Craft.Warning.CantAddItem"));
        return;
    }

    await ChatMessageAvant.create({
        author: game.user.id,
        content: game.i18n.format("AVANT.Actions.Craft.Information.ReceiveItem", {
            actorName: actor.name,
            quantity: itemQuantity,
            itemName: item.name,
        }),
        speaker: { alias: actor.name },
    });
}

export async function craftSpellConsumable(
    item: ConsumableAvant,
    itemQuantity: number,
    actor: ActorAvant,
): Promise<void> {
    const consumableType = item.category;
    if (!(consumableType === "scroll" || consumableType === "wand")) return;
    const spellLevel = (
        consumableType === "wand" ? Math.ceil(item.level / 2) - 1 : Math.ceil(item.level / 2)
    ) as OneToTen;
    const validSpells = actor.itemTypes.spell
        .filter((s) => s.baseRank <= spellLevel && !s.isCantrip && !s.isFocusSpell && !s.isRitual)
        .reduce(
            (result, spell) => {
                result[spell.baseRank] = [...(result[spell.baseRank] || []), spell];
                return result;
            },
            {} as Record<number, SpellAvant<ActorAvant>[]>,
        );
    const content = await renderTemplate("systems/avant/templates/actors/crafting-select-spell-dialog.hbs", {
        spells: validSpells,
    });

    new Dialog({
        title: game.i18n.localize("AVANT.Actions.Craft.SelectSpellDialog.Title"),
        content,
        buttons: {
            cancel: {
                icon: fontAwesomeIcon("times").outerHTML,
                label: game.i18n.localize("Cancel"),
            },
            craft: {
                icon: fontAwesomeIcon("hammer").outerHTML,
                label: game.i18n.localize("AVANT.Actions.Craft.SelectSpellDialog.CraftButtonLabel"),
                callback: async ($dialog) => {
                    const spellId = String($dialog.find("select[name=spell]").val());
                    const spell = actor.items.get(spellId);
                    if (!spell?.isOfType("spell")) return;
                    const data = await createConsumableFromSpell(spell, {
                        type: consumableType,
                        heightenedLevel: spellLevel,
                    });
                    return craftItem(new ItemProxyAvant(data) as PhysicalItemAvant, itemQuantity, actor);
                },
            },
        },
        default: "craft",
    }).render(true);
}

export async function renderCraftingInline(
    item: PhysicalItemAvant,
    roll: Rolled<CheckRoll>,
    quantity: number,
    actor: ActorAvant,
    free: boolean,
    skill: string = "crafting",
): Promise<string | null> {
    if (!actor.isOfType("character")) return null;

    const degreeOfSuccess = roll.options.degreeOfSuccess ?? 0;
    const costs = calculateCosts(item, quantity, actor, degreeOfSuccess, skill);
    if (!costs) return null;

    const daysForZeroCost = degreeOfSuccess > 1 ? calculateDaysToNoCost(costs) : 0;

    return await renderTemplate("systems/avant/templates/chat/crafting-result.hbs", {
        daysForZeroCost: daysForZeroCost,
        strings: await prepStrings(costs, item),
        item,
        quantity,
        success: degreeOfSuccess > 1,
        criticalFailure: degreeOfSuccess === 0,
        free: free,
    });
}
