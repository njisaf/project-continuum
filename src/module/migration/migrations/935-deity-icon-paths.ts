import type { ActorSourceAvant } from "@actor/data/index.ts";
import type { ItemSourceAvant } from "@item/base/data/index.ts";
import type { TokenSource } from "types/foundry/common/documents/token.d.ts";
import { MigrationBase } from "../base.ts";

/** Clean up Calling items, setting a category and removing tags */
export class Migration935DeityIconPaths extends MigrationBase {
    static override version = 0.935;

    #getUpdatedPath<TPath extends ImageFilePath | VideoFilePath>(
        path: TPath,
        options?: { type?: string | null; slug?: string | null },
    ): TPath;
    #getUpdatedPath(
        path: string,
        { type = null, slug = null }: { type?: string | null; slug?: string | null } = {},
    ): string {
        if (typeof path !== "string" || !path.startsWith("systems/avant/icons/deity/")) return path;
        if (["effect", "feat"].includes(type ?? "") && slug?.match(/-(?:minor|moderate|major)-(?:boon|curse)$/)) {
            const deitySlug = slug.replace(/-(?:minor|moderate|major)-(?:boon|curse)$/, "");
            return `systems/avant/icons/deities/${deitySlug}.webp`;
        }
        if (type === "deity" && slug) return `systems/avant/icons/deities/${slug}.webp`;
        return "systems/avant/icons/default-icons/deity.svg";
    }

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        source.img = this.#getUpdatedPath(source.img);
        if (source.prototypeToken?.texture?.src) {
            source.prototypeToken.texture.src = this.#getUpdatedPath(source.prototypeToken.texture.src);
        }
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        source.img = this.#getUpdatedPath(source.img, { type: source.type, slug: source.system.slug });
    }

    override async updateToken(source: TokenSource): Promise<void> {
        source.texture.src &&= this.#getUpdatedPath(source.texture.src);
    }
}
