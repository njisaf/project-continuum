import { MigrationRunner } from "../module/migration/runner/index.ts";

/** Store the world system and schema versions for the first time */
export async function storeInitialWorldVersions(): Promise<void> {
    if (!game.user.hasRole(CONST.USER_ROLES.GAMEMASTER)) return;

    const storedSystemVersion = game.settings.storage.get("world").getItem("avant.worldSystemVersion");
    if (!storedSystemVersion) {
        await game.settings.set("avant", "worldSystemVersion", game.system.version);
    }

    const storedSchemaVersion = game.settings.storage.get("world").getItem("avant.worldSchemaVersion");
    if (!storedSchemaVersion) {
        const minimumVersion = MigrationRunner.RECOMMENDED_SAFE_VERSION;
        const currentVersion =
            game.actors.size === 0
                ? game.settings.get("avant", "worldSchemaVersion")
                : Math.max(
                      Math.min(...new Set(game.actors.map((actor) => actor.schemaVersion ?? minimumVersion))),
                      minimumVersion,
                  );
        await game.settings.set("avant", "worldSchemaVersion", currentVersion);
    }
}
