import { ActorAvant, ActorProxyAvant } from "@actor";
import { ItemAvant, ItemProxyAvant } from "@item";
import type { TokenDocumentAvant } from "@scene";
import * as R from "remeda";
import { CombatantAvant } from "./encounter/index.ts";
import { MigrationList, MigrationRunner } from "./migration/index.ts";
import { MigrationRunnerBase } from "./migration/runner/base.ts";

/** Ensure that the import JSON is actually importable and that the data is fully migrated */
async function preImportJSON(json: string): Promise<string | null> {
    const source: unknown = JSON.parse(json);
    if (!R.isPlainObject(source)) return null;
    if ("data" in source) {
        if ("items" in source) {
            ActorAvant.migrateData(source);
        } else {
            ItemAvant.migrateData(source);
        }
    }
    if (!R.isPlainObject(source.system)) return null;

    if (R.isPlainObject(source.system.schema) && !R.isPlainObject(source.system._migration)) {
        source.system._migration = { version: Number(source.system.schema.version) || null };
        delete source.system.schema;
    }

    if (!R.isPlainObject(source.system._migration)) {
        return null;
    }

    const sourceSchemaVersion = Number(source.system?._migration?.version) || 0;
    const worldSchemaVersion = MigrationRunnerBase.LATEST_SCHEMA_VERSION;
    if (fu.isNewerVersion(sourceSchemaVersion, worldSchemaVersion)) {
        // Refuse to import if the schema version on the document is higher than the system schema verson;
        ui.notifications.error(
            game.i18n.format("AVANT.ErrorMessage.CantImportTooHighVersion", {
                sourceName: game.i18n.localize("DOCUMENT.Actor"),
                sourceSchemaVersion,
                worldSchemaVersion,
            }),
        );
        return null;
    }

    const Cls: ConstructorOf<ActorAvant | ItemAvant> =
        "items" in source && Array.isArray(source.items) ? ActorProxyAvant : ItemProxyAvant;
    const newDoc: ItemAvant | ActorAvant = new Cls(source);
    const migrations = MigrationList.constructFromVersion(newDoc.schemaVersion);
    await MigrationRunner.ensureSchemaVersion(newDoc, migrations);

    return JSON.stringify(newDoc.toObject());
}

function combatantAndTokenDoc(document: CombatantAvant | TokenDocumentAvant): {
    combatant: CombatantAvant | null;
    tokenDoc: TokenDocumentAvant | null;
} {
    return document instanceof CombatantAvant
        ? { combatant: document, tokenDoc: document.token }
        : { combatant: document.combatant, tokenDoc: document };
}

export { combatantAndTokenDoc, preImportJSON };
