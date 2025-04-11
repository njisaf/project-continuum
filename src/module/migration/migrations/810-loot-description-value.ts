import { ActorSourceAvant } from "@actor/data/index.ts";
import { MigrationBase } from "../base.ts";

/** Remove value property from loot actor description */
export class Migration810LootDescriptionValue extends MigrationBase {
    static override version = 0.81;

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        if (source.type === "loot") {
            const details: MaybeWithValue = source.system.details;
            if (details.description instanceof Object) {
                details.description = String(details.description.value ?? "");
            }
        }
    }
}

interface MaybeWithValue {
    description: { value: string } | string;
}
