import { UserAvant } from "@module/user/document.ts";
import { MigrationBase } from "../base.ts";

/** Migrate the old "showRollDialogs" setting into the new pair. */
export class Migration880SplitShowDialogsSettings extends MigrationBase {
    static override version = 0.88;

    override async migrate(): Promise<void> {
        const userUpdates = game.users.contents.flatMap((user) => {
            const userSource = user._source;
            const settings: Record<string, boolean | null> | undefined = userSource.flags.avant?.settings;

            if (typeof settings?.showRollDialogs === "boolean") {
                settings.showCheckDialogs = settings.showRollDialogs;
                settings.showDamageDialogs = settings.showRollDialogs;
                settings["-=showRollDialogs"] = null;
                return { _id: user.id, "flags.avant.settings": settings };
            }

            return [];
        });

        await UserAvant.updateDocuments(userUpdates);
    }
}
