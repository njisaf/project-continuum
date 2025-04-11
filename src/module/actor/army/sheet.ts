import { ActorSheetAvant, SheetClickActionHandlers } from "@actor/sheet/base.ts";
import { ActorSheetDataAvant } from "@actor/sheet/data-types.ts";
import { ItemSummaryRenderer } from "@actor/sheet/item-summary-renderer.ts";
import { CampaignFeatureAvant, ItemAvant, ItemProxyAvant } from "@item";
import type { ItemSourceAvant } from "@item/base/data/index.ts";
import type { DropCanvasItemDataAvant } from "@module/canvas/drop-canvas-data.ts";
import { ChatMessageAvant } from "@module/chat-message/document.ts";
import { AdjustedValue, eventToRollParams, getAdjustedValue, getAdjustment } from "@module/sheet/helpers.ts";
import { kingmakerTraits } from "@scripts/config/traits.ts";
import { ErrorAvant, htmlClosest, htmlQuery, htmlQueryAll, objectHasKey, tupleHasValue } from "@util";
import * as R from "remeda";
import type { ArmyAvant } from "./document.ts";
import { ARMY_TYPES, BASIC_WAR_ACTIONS_FOLDER, getArmyGearData } from "./values.ts";

class ArmySheetAvant extends ActorSheetAvant<ArmyAvant> {
    /** Basic war actions are sheet data. Note that they cannot ever work with rule elements */
    basicWarActions: CampaignFeatureAvant[] = [];

    override itemRenderer = new ArmyItemRenderer(this);

    static override get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "army"],
            width: 750,
            height: 625,
            template: "systems/avant/templates/actors/army/sheet.hbs",
            scrollY: [".sheet-body"],
        };
    }

    override async getData(options?: Partial<ActorSheetOptions>): Promise<ArmySheetData> {
        const data = await super.getData(options);
        const actor = this.actor;
        const campaignFeatures = actor.itemTypes.campaignFeature;

        if (!this.basicWarActions.length) {
            const pack = game.packs.get("avant.kingmaker-features");
            const compendiumFeatures = ((await pack?.getDocuments({ type: "campaignFeature" })) ?? []).filter(
                (d): d is CampaignFeatureAvant<null> => d instanceof ItemAvant && d.isOfType("campaignFeature"),
            );
            this.basicWarActions = compendiumFeatures
                .filter((d) => d.system.category === "army-war-action" && d.folder?.id === BASIC_WAR_ACTIONS_FOLDER)
                .map((i) => new ItemProxyAvant(i.toObject(true), { parent: this.actor }))
                .filter((i): i is CampaignFeatureAvant<ArmyAvant> => i.isOfType("campaignFeature"));
        }

        return {
            ...data,
            description: await TextEditor.enrichHTML(actor.system.details.description, {
                rollData: actor.getRollData(),
            }),
            ac: {
                value: actor.armorClass.value,
                breakdown: actor.armorClass.breakdown,
                // When getting the ac adjustment class, factor in potency in the base (or it'll always be blue...)
                adjustmentClass: getAdjustment(
                    actor.armorClass.value,
                    actor._source.system.ac.value + actor.system.ac.potency,
                ),
            },
            consumption: getAdjustedValue(actor.system.consumption, actor._source.system.consumption, {
                better: "lower",
            }),
            hitPoints: {
                value: actor.system.attributes.hp.value,
                max: getAdjustedValue(actor.system.attributes.hp.max, actor._source.system.attributes.hp.max),
                routThreshold: getAdjustedValue(
                    actor.system.attributes.hp.routThreshold,
                    actor._source.system.attributes.hp.routThreshold,
                    { better: "lower" },
                ),
            },
            linked: !!actor.prototypeToken.actorLink && (!actor.token || actor.token.isLinked),
            armyTypes: R.pick(kingmakerTraits, ARMY_TYPES),
            rarityTraits: CONFIG.AVANT.rarityTraits,
            saves: R.sortBy(
                (["maneuver", "morale"] as const).map((slug) => {
                    const statistic = this.actor[slug];
                    return {
                        slug: slug,
                        label: statistic.label,
                        mod: statistic.mod,
                        breakdown: statistic.check.breakdown,
                        adjustmentClass: getAdjustment(statistic.mod, this.actor._source.system.saves[slug]),
                    };
                }),
                (s) => s.label,
            ),
            basicWarActions: this.basicWarActions,
            warActions: [
                ...campaignFeatures.filter((f) => f.category === "army-war-action"),
                ...campaignFeatures.filter((f) => f.category === "army-tactic" && !!f.actionCost),
            ],
        };
    }

    override activateListeners($html: JQuery<HTMLElement>): void {
        super.activateListeners($html);
        const html = $html[0];

        const levelInput = htmlQuery<HTMLInputElement>(html, ".level");
        levelInput?.addEventListener("change", () => {
            const value = levelInput.value;
            this.actor.updateLevel(Number(value));
        });

        for (const rollableStat of htmlQueryAll(html, ".rollable")) {
            const statSlug = htmlClosest(rollableStat, "[data-statistic]")?.dataset.statistic;
            if (!statSlug) continue;

            rollableStat.addEventListener("click", (event) => {
                const statistic = this.actor.getStatistic(statSlug);
                statistic?.roll(eventToRollParams(event, { type: "check" }));
            });
        }

        htmlQuery(html, "[data-action=link-actor]")?.addEventListener("click", () => {
            if (this.actor.token) {
                ui.notifications.error("AVANT.Kingmaker.Army.Alliance.LinkError", { localize: true });
            } else {
                this.actor.update({ prototypeToken: { actorLink: true } });
            }
        });

        // Handle resource updates
        for (const resourceElement of htmlQueryAll(html, "[data-action=change-resource]")) {
            const resource = resourceElement.dataset.resource;
            if (!tupleHasValue(["potions", "ammunition"], resource)) continue;
            const max = this.actor.system.resources[resource].max;

            resourceElement.addEventListener("click", () => {
                const newValue = Math.clamp(this.actor.system.resources[resource].value + 1, 0, max);
                this.actor.update({ [`system.resources.${resource}.value`]: newValue });
            });
            resourceElement.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                const newValue = Math.clamp(this.actor.system.resources[resource].value - 1, 0, max);
                this.actor.update({ [`system.resources.${resource}.value`]: newValue });
            });
        }

        htmlQuery(html, "[data-action=reset-ammo]")?.addEventListener("click", () => {
            const max = this.actor.system.resources.ammunition.max;
            this.actor.update({ "system.resources.ammunition.value": max });
        });

        htmlQuery(html, "[data-action=use-potion]")?.addEventListener("click", () => {
            this.actor.usePotion();
        });

        // Handle direct magic armor updates
        for (const gearElement of htmlQueryAll(html, "[data-action=change-magic-armor]")) {
            gearElement.addEventListener("click", () => {
                const newValue = Math.clamp(this.actor.system.ac.potency + 1, 0, 3);
                this.actor.update({ [`system.ac.potency`]: newValue });
            });
            gearElement.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                const newValue = Math.clamp(this.actor.system.ac.potency - 1, 0, 3);
                this.actor.update({ [`system.ac.potency`]: newValue });
            });
        }

        // Handle direct magic weapon updates
        for (const gearElement of htmlQueryAll(html, "[data-action=change-magic-weapon]")) {
            const gear = gearElement.dataset.weapon;
            if (!tupleHasValue(["melee", "ranged"], gear)) continue;
            const data = this.actor.system.weapons[gear];
            gearElement.addEventListener("click", () => {
                if (data) {
                    const newValue = Math.clamp(data.potency + 1, 0, 3);
                    this.actor.update({ [`system.weapons.${gear}.potency`]: newValue });
                } else {
                    const newData = { name: "", potency: 0 };
                    this.actor.update({ [`system.weapons.${gear}`]: newData });
                }
            });
            gearElement.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                if (!data) return;

                if (data.potency === 0) {
                    this.actor.update({ [`system.weapons.${gear}`]: null });
                } else {
                    const newValue = Math.clamp(data.potency - 1, 0, 3);
                    this.actor.update({ [`system.weapons.${gear}.potency`]: newValue });
                }
            });
        }

        // Listeners for showing gear purchase chat messages
        const gearData = getArmyGearData();
        for (const showGear of htmlQueryAll(html, "[data-action=show-gear]")) {
            const rawGearType = showGear.dataset.gear;
            const gearType =
                tupleHasValue(["melee", "ranged"], rawGearType) && !this.actor.system.weapons[rawGearType]
                    ? `additional-${rawGearType}`
                    : rawGearType;
            if (!objectHasKey(gearData, gearType)) continue;

            const kingmakerTraits: Record<string, string | undefined> = CONFIG.AVANT.kingmakerTraits;
            const actionTraits: Record<string, string | undefined> = CONFIG.AVANT.actionTraits;
            const descriptions: Record<string, string | undefined> = CONFIG.AVANT.traitsDescriptions;

            showGear.addEventListener("click", async () => {
                const gear = gearData[gearType];
                ChatMessageAvant.create({
                    speaker: ChatMessageAvant.getSpeaker({ actor: this.actor }),
                    content: await renderTemplate("systems/avant/templates/actors/army/gear-card.hbs", {
                        ...gear,
                        level: gear.level ?? (gear.ranks?.length ? `${gear.ranks[0].level}+` : null),
                        traits: gear.traits.map((t) => ({
                            label: game.i18n.localize(kingmakerTraits[t] ?? actionTraits[t] ?? t),
                            description: game.i18n.localize(descriptions[t] ?? ""),
                        })),
                    }),
                });
            });
        }

        htmlQuery(html, "[data-action=edit-description]")?.addEventListener("click", () => {
            this.activateEditor("system.details.description");
        });

        for (const strikeAttack of htmlQueryAll(html, "[data-action=strike-attack]")) {
            const type = htmlClosest(strikeAttack, "[data-strike]")?.dataset.strike;
            const variant = Number(strikeAttack.dataset.variantIndex);
            if (!objectHasKey(this.actor.strikes, type)) continue;

            strikeAttack.addEventListener("click", (event) => {
                this.actor.strikes[type]?.variants[variant]?.roll({ event });
            });
        }

        for (const strikeDamage of htmlQueryAll(html, "[data-action=strike-damage]")) {
            const type = htmlClosest(strikeDamage, "[data-strike]")?.dataset.strike;
            const outcome = strikeDamage.dataset.outcome === "criticalSuccess" ? "critical" : "damage";
            if (!objectHasKey(this.actor.strikes, type)) continue;

            strikeDamage.addEventListener("click", (event) => {
                this.actor.strikes[type]?.[outcome]({ event });
            });
        }
    }

    protected override activateClickListener(html: HTMLElement): SheetClickActionHandlers {
        const handlers = super.activateClickListener(html);

        handlers["toggle-basic-war-action-summary"] = async (event) => {
            const element = htmlClosest(event.target, "[data-slug]");
            if (element) this.itemRenderer.toggleSummary(element);
        };

        handlers["use-basic-war-action"] = async (event) => {
            const slug = htmlClosest(event.target, "[data-slug]")?.dataset.slug;
            const item = this.basicWarActions.find((a) => a.slug === slug);
            item?.toMessage(event);
        };

        return handlers;
    }

    protected override async _onDropItem(event: DragEvent, data: DropCanvasItemDataAvant): Promise<ItemAvant[]> {
        const item = await ItemAvant.fromDropData(data);
        if (!item) throw ErrorAvant("Unable to create item from drop data!");

        // If the actor is the same, call the parent method, which will eventually call the sort instead
        if (this.actor.uuid === item.parent?.uuid) {
            return super._onDropItem(event, data);
        }

        if (item?.isOfType("campaignFeature") && (item.isFeat || item.isFeature)) {
            const slotData = this.#getFeatSlotData(event) ?? { groupId: "bonus", slotId: null };
            const group = slotData.groupId === "tactics" ? this.actor.tactics : this.actor.bonusTactics;
            return group.insertFeat(item, slotData.slotId);
        }

        return super._onDropItem(event, data);
    }

    /** Handle a drop event for an existing Owned Item to sort that item */
    protected override async _onSortItem(event: DragEvent, itemSource: ItemSourceAvant): Promise<ItemAvant[]> {
        const item = this.actor.items.get(itemSource._id!);
        if (item?.isOfType("campaignFeature") && (item.isFeat || item.isFeature)) {
            // In the army sheet, dragging outside the slot immediately makes it a bonus slot
            const featSlot = this.#getFeatSlotData(event) ?? { groupId: "bonus", slotId: null };
            const group = featSlot.groupId === "tactics" ? this.actor.tactics : this.actor.bonusTactics;
            const resorting = item.group === group && !group?.slotted;
            if (group?.slotted && !featSlot.slotId) {
                return [];
            } else if (!resorting) {
                return group.insertFeat(item, featSlot.slotId);
            }
        }

        return super._onSortItem(event, itemSource);
    }

    #getFeatSlotData(event: DragEvent): { slotId: string | undefined; groupId: string } | null {
        const groupId = htmlClosest(event.target, "[data-group-id]")?.dataset.groupId;
        const slotId = htmlClosest(event.target, "[data-slot-id]")?.dataset.slotId;
        return typeof groupId === "string" ? { slotId, groupId } : null;
    }
}

class ArmyItemRenderer extends ItemSummaryRenderer<ArmyAvant, ArmySheetAvant> {
    protected override async getItemFromElement(element: HTMLElement): Promise<ClientDocument | null> {
        const slug = element.dataset.slug;
        const item = this.sheet.basicWarActions.find((a) => a.slug === slug);
        return item ?? super.getItemFromElement(element);
    }
}

interface ArmySheetData extends ActorSheetDataAvant<ArmyAvant> {
    description: string;
    ac: {
        value: number;
        breakdown: string;
        adjustmentClass: string | null;
    };
    consumption: AdjustedValue;
    hitPoints: {
        value: number;
        max: AdjustedValue;
        routThreshold: AdjustedValue;
    };
    linked: boolean;
    armyTypes: Record<string, string>;
    rarityTraits: Record<string, string>;
    saves: ArmySaveSheetData[];
    basicWarActions: CampaignFeatureAvant[];
    warActions: CampaignFeatureAvant[];
}

interface ArmySaveSheetData {
    slug: string;
    label: string;
    mod: number;
    breakdown: string;
    adjustmentClass: string | null;
}

export { ArmySheetAvant };
