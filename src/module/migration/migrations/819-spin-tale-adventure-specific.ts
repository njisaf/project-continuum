import { ItemSourceAvant } from "@item/base/data/index.ts";
import { MigrationBase } from "../base.ts";

/** Replace links to adventure-specific Spin Tale */
export class Migration819SpinTaleAdventureSpecific extends MigrationBase {
    static override version = 0.819;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type === "feat") {
            const oldSpinTale = "Compendium.avant.adventure-specific-actions.Spin Tale";
            const newSpinTale = "Compendium.avant.actionsavant.Spin Tale";

            const oldSpinTaleId = "Compendium.avant.adventure-specific-actions.5gahZQXf3UVwATSC";
            const newSpinTaleId = "Compendium.avant.actionsavant.hPZQ5vA9QHEPtjFW";

            source.system.description.value = source.system.description.value.replace(oldSpinTale, newSpinTale);
            source.system.description.value = source.system.description.value.replace(oldSpinTaleId, newSpinTaleId);
        }
    }
}
