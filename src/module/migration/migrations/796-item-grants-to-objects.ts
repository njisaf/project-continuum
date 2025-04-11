import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { ItemGrantSource } from "@item/base/data/system.ts";
import { sluggify } from "@util";
import { MigrationBase } from "../base.ts";

/** Convert `itemGrants` flags from arrays to `Record<string, GrantedItemData>`s */
export class Migration796ItemGrantsToObjects extends MigrationBase {
    static override version = 0.796;

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        for (const item of source.items) {
            const systemFlags = item.flags.avant;
            if (!systemFlags?.itemGrants || !Array.isArray(systemFlags.itemGrants)) continue;

            systemFlags.itemGrants = systemFlags.itemGrants.reduce(
                (grantsObject: Record<string, ItemGrantSource>, grant) => {
                    if (typeof grant === "string" || grant instanceof Object) {
                        const [flag, grantSource] = this.#convertToEntry(source, item, grant);
                        if (flag !== null) {
                            const modifiedFlag = this.#modifyFlag(grantsObject, flag);
                            grantsObject[modifiedFlag] = grantSource;
                        }
                    }
                    return grantsObject;
                },
                {},
            );
        }
    }

    #convertToEntry(
        actor: ActorSourceAvant,
        granter: ItemSourceAvant,
        grantedData: ItemGrantSource | string,
    ): [string, ItemGrantSource] | [null, null] {
        const grantedId = grantedData instanceof Object ? grantedData.id : grantedData;
        if (actor.items.some((i) => i._id === grantedId)) {
            return [sluggify(granter.name, { camel: "dromedary" }), { id: grantedId }];
        }
        return [null, null];
    }

    /** Append a number to the flag if this grant is among multiple GrantItem REs on an item */
    #modifyFlag(grantedItems: Record<string, ItemGrantSource>, flag: string): string {
        const pattern = new RegExp(`^${flag}\\d*$`);
        const nthGrant = Object.keys(grantedItems).filter((g) => pattern.test(g)).length;
        return nthGrant === 0 ? flag : `${flag}${nthGrant + 1}`;
    }
}
