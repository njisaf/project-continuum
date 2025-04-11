import { ActorAvant } from "@actor";
import { FeatAvant, ItemAvant } from "@item";
import type { AncestrySource, AncestrySystemData } from "@item/ancestry/data.ts";
import type { BackgroundSource, BackgroundSystemData } from "@item/background/data.ts";
import type { ClassSource, ClassSystemData } from "@item/class/data.ts";
import { Rarity } from "@module/data.ts";
import { ErrorAvant, objectHasKey } from "@util";
import { UUIDUtils } from "@util/uuid.ts";

/** Abstract base class representing a Pathfinder (A)ncestry, (B)ackground, or (C)lass */
abstract class ABCItemAvant<TParent extends ActorAvant | null> extends ItemAvant<TParent> {
    get rarity(): Rarity {
        return this.system.traits.rarity;
    }

    /** Returns all items that should also be deleted should this item be deleted */
    override getLinkedItems(): FeatAvant<ActorAvant>[] {
        if (!this.actor || !objectHasKey(this.actor.itemTypes, this.type)) return [];
        const existingABCIds = this.actor.itemTypes[this.type].map((i) => i.id);
        return this.actor.itemTypes.feat.filter((f) => existingABCIds.includes(f.system.location ?? ""));
    }

    /** Returns items that should also be added when this item is created */
    override async createGrantedItems(options: { level?: number } = {}): Promise<FeatAvant<null>[]> {
        const entries = Object.values(this.system.items);
        const packEntries = entries.filter((entry) => !!entry.uuid);
        if (packEntries.length === 0) return [];

        const items = (await UUIDUtils.fromUUIDs(entries.map((e) => e.uuid))).map((i) => i.clone());
        const level = options.level ?? this.parent?.level;

        return items.flatMap((item): FeatAvant<null> | never[] => {
            if (item instanceof FeatAvant) {
                if (item.category === "classfeature") {
                    const level = entries.find((e) => item.sourceId === e.uuid)?.level ?? item.level;
                    item.updateSource({ "system.level.value": level });
                }

                if (typeof level === "number" && level < item.level) {
                    return [];
                }

                item.updateSource({ system: { location: this.id } });
                return item;
            } else {
                console.error(ErrorAvant("Missing or invalid ABC item"));
                return [];
            }
        });
    }

    protected logAutoChange(path: string, value: string | number): void {
        if (value === 0 || !this.actor) return;
        this.actor.system.autoChanges[path] = [
            {
                mode: "upgrade",
                level: 1,
                value: value,
                source: this.name,
            },
        ];
    }
}

interface ABCItemAvant<TParent extends ActorAvant | null> extends ItemAvant<TParent> {
    readonly _source: AncestrySource | BackgroundSource | ClassSource;
    system: AncestrySystemData | BackgroundSystemData | ClassSystemData;
}

export { ABCItemAvant };
