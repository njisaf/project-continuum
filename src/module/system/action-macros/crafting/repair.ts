import { PhysicalItemAvant } from "@item";
import { ChatMessageAvant } from "@module/chat-message/index.ts";
import { calculateDC } from "@module/dc.ts";
import { CheckDC } from "@system/degree-of-success.ts";
import { ActionMacroHelpers } from "../helpers.ts";
import { SkillActionOptions } from "../types.ts";
import { SelectItemDialog } from "./select-item.ts";

async function repair(options: RepairActionOptions): Promise<void> {
    // resolve item
    const item = options.item ?? (await (options.uuid ? fromUuid(options.uuid) : SelectItemDialog.getItem("repair")));

    // ensure specified item is a valid crafting target
    if (!(item instanceof PhysicalItemAvant)) {
        ui.notifications.warn(
            game.i18n.format("AVANT.Actions.Repair.Warning.NotPhysicalItem", { item: item?.name ?? "" }),
        );
        return;
    }

    // check that actor has the necessary repair kit to craft item?
    // verify that item is damaged but not destroyed

    // figure out DC from item
    const dc: CheckDC | undefined =
        options.difficultyClass ??
        (() => {
            if (item) {
                const pwol = game.avant.settings.variants.pwol.enabled;
                return {
                    label: game.i18n.format("AVANT.Actions.Repair.Labels.ItemLevelRepairDC", { level: item.level }),
                    value: calculateDC(item.level, { pwol }),
                    visibility: "all",
                };
            }
            return;
        })();

    const targetItemOptions = Array.from(item?.traits ?? []).map((trait) => `target:trait:${trait}`);

    const slug = options?.skill ?? "crafting";
    const rollOptions = ["action:repair", ...targetItemOptions];
    const modifiers = options?.modifiers;
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph,
        title: "AVANT.Actions.Repair.Title",
        checkContext: (opts) => ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug }),
        content: async (title) => {
            if (item) {
                const templatePath = "systems/avant/templates/system/actions/repair/item-heading-partial.hbs";
                const templateData = { item };
                const content = await renderTemplate(templatePath, templateData);
                return title + content;
            }
            return;
        },
        traits: ["exploration", "manipulate"],
        event: options.event,
        difficultyClass: dc,
        extraNotes: (selector: string) => [
            ActionMacroHelpers.note(selector, "AVANT.Actions.Repair", "criticalSuccess"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Repair", "success"),
            ActionMacroHelpers.note(selector, "AVANT.Actions.Repair", "criticalFailure"),
        ],
        createMessage: false,
        callback: async (result) => {
            // react to check result by posting a chat message with appropriate follow-up options
            const { actor } = result;
            if (item && result.message instanceof ChatMessageAvant && actor.isOfType("creature")) {
                const messageSource = result.message.toObject();
                const flavor = await (async () => {
                    const proficiencyRank = actor.skills.crafting.rank ?? 0;
                    if ("criticalSuccess" === result.outcome) {
                        const label = "AVANT.Actions.Repair.Labels.RestoreItemHitPoints";
                        const restored = String(10 + proficiencyRank * 10);
                        return renderRepairResult(item, "restore", label, restored);
                    } else if ("success" === result.outcome) {
                        const label = "AVANT.Actions.Repair.Labels.RestoreItemHitPoints";
                        const restored = String(5 + proficiencyRank * 5);
                        return renderRepairResult(item, "restore", label, restored);
                    } else if ("criticalFailure" === result.outcome) {
                        const label = "AVANT.Actions.Repair.Labels.RollItemDamage";
                        const damage = "2d6";
                        return renderRepairResult(item, "roll-damage", label, damage);
                    }
                    return "";
                })();
                if (flavor) {
                    messageSource.flavor += flavor;
                }
                await ChatMessage.create(messageSource);
            }
        },
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}

async function onRepairChatCardEvent(
    event: MouseEvent,
    message: ChatMessageAvant | undefined,
    card: HTMLElement,
): Promise<void> {
    const itemUuid = card.dataset.itemUuid;
    const item = await fromUuid(itemUuid ?? "");
    const button = event.currentTarget;
    if (!(item instanceof PhysicalItemAvant) || !(button instanceof HTMLElement)) {
        return;
    }

    const repair = button.dataset.repair;
    const speaker =
        message &&
        ChatMessageAvant.getSpeaker({
            actor: message.actor,
            alias: message.alias,
            token: message.token,
        });
    if (repair === "restore") {
        const value = Number(button.dataset.repairValue) || 0;
        const beforeRepair = item.system.hp.value;
        const afterRepair = Math.min(item.system.hp.max, beforeRepair + value);
        await item.update({ "system.hp.value": afterRepair });
        const content = game.i18n.format("AVANT.Actions.Repair.Chat.ItemRepaired", {
            itemName: item.name,
            repairedDamage: afterRepair - beforeRepair,
            afterRepairHitPoints: afterRepair,
            maximumHitPoints: item.system.hp.max,
        });
        await ChatMessage.create({ content, speaker });
    } else if (repair === "roll-damage") {
        const roll = await Roll.create("2d6").evaluate();
        const templatePath = "systems/avant/templates/system/actions/repair/roll-damage-chat-message.hbs";
        const flavor = await renderTemplate(templatePath, {
            damage: {
                dealt: Math.max(0, roll.total - item.system.hardness),
                rolled: roll.total,
            },
            item,
        });
        await roll.toMessage({
            flags: {
                avant: {
                    suppressDamageButtons: true,
                },
            },
            flavor,
            speaker,
        });
    } else if (repair === "damage") {
        const hardness = Math.max(0, item.system.hardness);
        const damage = (message?.rolls.at(0)?.total ?? 0) - hardness;
        if (damage > 0) {
            const beforeDamage = item.system.hp.value;
            const afterDamage = Math.max(0, item.system.hp.value - damage);
            await item.update({ "system.hp.value": afterDamage });
            const content = game.i18n.format("AVANT.Actions.Repair.Chat.ItemDamaged", {
                itemName: item.name,
                damageDealt: beforeDamage - afterDamage,
                afterDamageHitPoints: afterDamage,
                maximumHitPoints: item.system.hp.max,
            });
            await ChatMessage.create({ content, speaker });
        } else {
            const templatePath = "systems/avant/templates/system/actions/repair/roll-damage-chat-message.hbs";
            const content = await renderTemplate(templatePath, {
                damage: {
                    dealt: 0,
                    rolled: message?.rolls.at(0)?.total ?? 0,
                },
                item,
            });
            await ChatMessage.create({ content, speaker });
        }
    }
}

async function renderRepairResult(
    item: PhysicalItemAvant,
    result: "restore" | "roll-damage",
    buttonLabel: string,
    value: string,
): Promise<string> {
    const templatePath = "systems/avant/templates/system/actions/repair/repair-result-partial.hbs";
    const label = game.i18n.format(buttonLabel, { value });
    return renderTemplate(templatePath, { item, label, result, value });
}

interface RepairActionOptions extends SkillActionOptions {
    difficultyClass?: CheckDC;
    item?: PhysicalItemAvant;
    uuid?: string;
}

export { onRepairChatCardEvent, repair };
