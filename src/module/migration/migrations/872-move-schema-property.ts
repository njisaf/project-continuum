import { ActorSystemSource } from "@actor/data/base.ts";
import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { ItemSystemSource } from "@item/base/data/system.ts";
import * as R from "remeda";
import { MigrationBase } from "../base.ts";

/**  Remove the `schema` property and create a new `_migration` one */
export class Migration872MoveSchemaProperty extends MigrationBase {
    static override version = 0.872;

    #mvSchema(system: (ItemSystemSource | ActorSystemSource) & { "-=schema"?: null }): void {
        const migrations = (system._migration ??= { version: null, previous: null });
        if ("schema" in system) {
            system["-=schema"] = null;
            if (R.isPlainObject(system.schema) && typeof system.schema.version === "number") {
                migrations.version = system.schema.version;
            }
        }
    }

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        this.#mvSchema(source.system);
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        this.#mvSchema(source.system);
    }
}
