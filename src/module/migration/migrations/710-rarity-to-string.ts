import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { MigrationBase } from "../base.ts";

export class Migration710RarityToString extends MigrationBase {
    static override version = 0.71;

    private updateTraits(traits: { rarity?: string | { value: string }; value?: unknown } | null): void {
        if (typeof traits?.rarity === "object" && traits.rarity !== null) {
            traits.rarity = traits.rarity.value;
        }
    }

    override async updateActor(actorSource: ActorSourceAvant): Promise<void> {
        if ("traits" in actorSource.system) this.updateTraits(actorSource.system.traits ?? null);
    }

    override async updateItem(itemSource: ItemSourceAvant): Promise<void> {
        if ("traits" in itemSource.system) this.updateTraits(itemSource.system.traits ?? null);
    }
}
