import { ItemSourceAvant } from "@item/base/data/index.ts";
import { recursiveReplaceString } from "@util";
import { MigrationBase } from "../base.ts";

/** Rename references to retired compendiums */
export class Migration778RenameRetiredPackRefs extends MigrationBase {
    static override version = 0.778;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        const rename = (text: string) =>
            text
                .replace(/\bavant\.consumable-effects\b/g, "avant.equipment-effects")
                .replace(/\bavant\.exploration-effects\b/g, "avant.other-effects")
                .replace(/\bavant\.feature-effects\b/g, "avant.feat-effects")
                .replace(/\bavant\.equipment-effects\.I9lfZUiCwMiGogVi\b/g, "avant.other-effects.I9lfZUiCwMiGogVi")
                // Cover in dev environment:
                .replace(/\bavant\.equipment-effects\.Cover\b/g, "avant.other-effects.Effect: Cover");

        source.system.rules = recursiveReplaceString(source.system.rules, rename);
        source.system.description = recursiveReplaceString(source.system.description, rename);
    }
}
