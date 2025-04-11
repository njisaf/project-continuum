import type { SkillSlug } from "@actor/types.ts";
import { ItemAvant, SpellAvant, type DeityAvant } from "@item";
import { ItemSheetDataAvant, ItemSheetOptions, ItemSheetAvant } from "@item/base/sheet/sheet.ts";
import { SheetOptions, createSheetOptions } from "@module/sheet/helpers.ts";
import type { HTMLTagifyTagsElement } from "@system/html-elements/tagify-tags.ts";
import { ErrorAvant, htmlClosest, htmlQuery, htmlQueryAll } from "@util";
import { tagify } from "@util/tags.ts";
import { UUIDUtils } from "@util/uuid.ts";
import * as R from "remeda";
import { DEITY_SANCTIFICATIONS } from "./values.ts";

export class DeitySheetAvant extends ItemSheetAvant<DeityAvant> {
    static override get defaultOptions(): ItemSheetOptions {
        return {
            ...super.defaultOptions,
            dragDrop: [{ dropSelector: ".sheet-header, .sheet-content" }],
        };
    }

    override async getData(options?: Partial<ItemSheetOptions>): Promise<DeitySheetData> {
        const sheetData = await super.getData(options);

        const spellEntries = Object.entries(sheetData.data.spells);
        const spells = (await UUIDUtils.fromUUIDs(Object.values(sheetData.data.spells)))
            .filter((i): i is SpellAvant => i instanceof SpellAvant)
            .map((spell) => {
                const level = Number(spellEntries.find(([, uuid]) => uuid === spell.uuid)?.at(0));
                return { uuid: spell.uuid, level, name: spell.name, img: spell.img };
            })
            .sort((spellA, spellB) => spellA.level - spellB.level);

        const sanctifications = [
            { value: "null", label: "AVANT.Item.Deity.Sanctification.None" },
            ...DEITY_SANCTIFICATIONS.map((value) => {
                const modal = value.modal.capitalize();
                const what = value.what.map((c) => c.capitalize()).join("");
                return {
                    value: JSON.stringify(value),
                    label: `AVANT.Item.Deity.Sanctification.${modal}.${what}`,
                };
            }),
        ];

        return {
            ...sheetData,
            categories: [
                { value: "deity", label: "TYPES.Item.deity" },
                { value: "pantheon", label: "AVANT.Item.Deity.Category.Pantheon" },
                { value: "covenant", label: "AVANT.Item.Deity.Category.Covenant" },
                { value: "philosophy", label: "AVANT.Item.Deity.Category.Philosophy" },
            ],
            sanctifications,
            skills: R.mapValues(CONFIG.AVANT.skills, (s) => s.label),
            divineFonts: createSheetOptions(
                { harm: "AVANT.Item.Deity.DivineFont.Harm", heal: "AVANT.Item.Deity.DivineFont.Heal" },
                sheetData.data.font,
            ),
            spells,
        };
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        // Create tagify selection inputs
        const getInput = (name: string): HTMLTagifyTagsElement | null =>
            htmlQuery<HTMLTagifyTagsElement>(html, `tagify-tags[name="${name}"]`);

        tagify(getInput("system.attribute"), { whitelist: CONFIG.AVANT.abilities, maxTags: 2 });

        tagify(getInput("system.skill"), { whitelist: CONFIG.AVANT.skills, maxTags: 2 });

        tagify(getInput("system.weapons"), { whitelist: CONFIG.AVANT.baseWeaponTypes, maxTags: 2 });

        const domainWhitelist = R.omitBy(CONFIG.AVANT.deityDomains, (_v, k) => k.endsWith("-apocryphal"));
        tagify(getInput("system.domains.primary"), { whitelist: domainWhitelist, maxTags: 6 });
        tagify(getInput("system.domains.alternate"), { whitelist: domainWhitelist, maxTags: 6 });

        const clericSpells = htmlQuery(html, ".cleric-spells");
        if (!clericSpells) return;

        // Remove a stored spell reference
        for (const link of htmlQueryAll(clericSpells, "a[data-action=remove-spell]")) {
            link.addEventListener("click", async (): Promise<void> => {
                const uuidToRemove = htmlClosest(link, "li")?.dataset.uuid;
                const [levelToRemove] =
                    Object.entries(this.item.system.spells).find(([_level, uuid]) => uuid === uuidToRemove) ?? [];
                if (!levelToRemove) {
                    this.render(false);
                    return;
                }

                await this.item.update({ [`system.spells.-=${levelToRemove}`]: null });
            });
        }

        // Update the level of a spell
        const spellLevelInputs = htmlQueryAll<HTMLInputElement>(clericSpells, "input[data-action=update-spell-level]");
        for (const input of spellLevelInputs) {
            input.addEventListener("change", async (): Promise<void> => {
                const oldLevel = Number(input.dataset.level);
                const uuid = this.item.system.spells[oldLevel];
                // Shouldn't happen unless the sheet falls out of sync
                if (!uuid) {
                    this.render(false);
                    return;
                }

                const newLevel = Math.clamp(Number(input.value) || 1, 1, 10);
                if (oldLevel !== newLevel) {
                    await this.item.update({
                        [`system.spells.-=${oldLevel}`]: null,
                        [`system.spells.${newLevel}`]: uuid,
                    });
                }
            });
        }
    }

    override async _onDrop(event: DragEvent): Promise<void> {
        if (!this.isEditable) return;

        const item = await (async (): Promise<ItemAvant | null> => {
            try {
                const dataString = event.dataTransfer?.getData("text/plain");
                const dropData = JSON.parse(dataString ?? "");
                return (await ItemAvant.fromDropData(dropData)) ?? null;
            } catch {
                return null;
            }
        })();
        if (!(item instanceof SpellAvant)) throw ErrorAvant("Invalid item drop on deity sheet");

        if (item.isCantrip || item.isFocusSpell || item.isRitual) {
            ui.notifications.error("AVANT.Item.Deity.ClericSpells.DropError", { localize: true });
            return;
        }

        await this.item.update({ [`system.spells.${item.rank}`]: item.uuid });
    }

    /** Foundry inflexibly considers checkboxes to be booleans: set back to a string tuple for Divine Font */
    override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        // Filter out null values from font that may have been inserted by Foundry's multi-checkbox handling
        if (Array.isArray(formData["system.font"])) {
            formData["system.font"] = formData["system.font"].filter((f) => !!f);
        }

        // Null out empty string for divine skill
        if (typeof formData["system.skill"] === "string") formData["system.skill"] ||= null;

        return super._updateObject(event, formData);
    }
}

interface DeitySheetData extends ItemSheetDataAvant<DeityAvant> {
    categories: FormSelectOption[];
    sanctifications: FormSelectOption[];
    skills: Record<SkillSlug, string>;
    divineFonts: SheetOptions;
    spells: SpellBrief[];
}

interface SpellBrief {
    uuid: ItemUUID;
    level: number;
    name: string;
    img: ImageFilePath;
}
