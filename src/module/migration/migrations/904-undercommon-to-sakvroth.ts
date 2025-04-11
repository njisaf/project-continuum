import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { recursiveReplaceString } from "@util";
import { MigrationBase } from "../base.ts";

/** Change all instances of "undercommon" to "sakvroth". */
export class Migration904UndercommonToSakvroth extends MigrationBase {
    static override version = 0.904;

    #replaceStrings<T extends object | string>(data: T): T {
        return recursiveReplaceString(data, (s) =>
            s.replace(/\bundercommon\b/g, "sakvroth").replace(/\bUndercommon\b/g, "Sakvroth"),
        );
    }

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        source.system = this.#replaceStrings(source.system);
        source.flags.avant &&= this.#replaceStrings(source.flags.avant);
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        source.system = this.#replaceStrings(source.system);
        source.flags.avant &&= this.#replaceStrings(source.flags.avant);
    }
}
