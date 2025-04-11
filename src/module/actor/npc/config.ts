import { CreatureConfig, CreatureConfigData } from "@actor/creature/config.ts";
import { createSheetOptions, SheetOptions } from "@module/sheet/helpers.ts";
import { NPCAvant } from "./document.ts";

export class NPCConfig extends CreatureConfig<NPCAvant> {
    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<NPCConfigData> {
        const lootableDefault = game.settings.get("avant", "automation.lootableNPCs");
        const lootableOptions = {
            default: `AVANT.Actor.NPC.Configure.Lootable.${lootableDefault ? "DefaultLootable" : "DefaultNotLootable"}`,
            lootable: "AVANT.Actor.NPC.Configure.Lootable.Lootable",
            notLootable: "AVANT.Actor.NPC.Configure.Lootable.NotLootable",
        };
        const lootableSelection = (() => {
            const storedSelection = this.actor._source.flags.avant?.lootable;
            return typeof storedSelection === "boolean" ? (storedSelection ? "lootable" : "notLootable") : "default";
        })();

        return {
            ...(await super.getData(options)),
            lootable: createSheetOptions(lootableOptions, { value: [lootableSelection] }),
        };
    }

    /** Remove stored properties if they're consistent with defaults; otherwise, store changes */
    override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        const key = "flags.avant.lootable";
        const lootable = formData[key];

        if (lootable === "default") {
            delete formData[key];
            formData["flags.avant.-=lootable"] = null;
        } else {
            formData[key] = lootable === "lootable";
        }

        return super._updateObject(event, formData);
    }
}

interface NPCConfigData extends CreatureConfigData<NPCAvant> {
    lootable: SheetOptions;
}
