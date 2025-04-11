import { AncestryAvant } from "@item";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { sluggify } from "@util";
import { MigrationBase } from "../base.ts";

/** Set a slug in heritages' ancestry data */
export class Migration823HeritageAncestrySlug extends MigrationBase {
    static override version = 0.823;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type !== "heritage" || !source.system.ancestry || source.system.ancestry.slug) {
            return;
        }

        const ancestry = await fromUuid(source.system.ancestry.uuid);
        source.system.ancestry.slug =
            ancestry instanceof AncestryAvant
                ? (ancestry.slug ?? sluggify(ancestry.name))
                : sluggify(source.system.ancestry.name);
    }
}
