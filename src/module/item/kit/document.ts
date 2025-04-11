import type { ActorAvant } from "@actor";
import { ActorSizeAvant } from "@actor/data/size.ts";
import { ItemAvant, type PhysicalItemAvant } from "@item";
import type { ClassTrait } from "@item/class/types.ts";
import { Price } from "@item/physical/data.ts";
import { DENOMINATIONS } from "@item/physical/values.ts";
import { Size } from "@module/data.ts";
import type { UserAvant } from "@module/user/index.ts";
import { ErrorAvant, isObject } from "@util";
import { UUIDUtils } from "@util/uuid.ts";
import { KitSource, KitSystemData, type KitEntryData } from "./data.ts";

class KitAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    static override get validTraits(): Record<ClassTrait, string> {
        return CONFIG.AVANT.classTraits;
    }

    get entries(): KitEntryData[] {
        return Object.values(this.system.items);
    }

    get price(): Price {
        return this.system.price;
    }

    /** Expand a tree of kit entry data into a list of physical items */
    override async createGrantedItems(
        options: { entries?: KitEntryData[]; containerId?: string; size?: Size } = {},
    ): Promise<PhysicalItemAvant<null>[]> {
        const size = new ActorSizeAvant({ value: options.size ?? "med", smallIsMedium: true }).value;
        const entries = options.entries ?? this.entries;
        const itemUUIDs = entries.map((e): ItemUUID => e.uuid);
        const items: unknown[] = await UUIDUtils.fromUUIDs(itemUUIDs);
        if (entries.length !== items.length) throw ErrorAvant(`Some items from ${this.name} were not found`);
        if (!items.every((i): i is ItemAvant<null> => i instanceof ItemAvant && !i.parent)) return [];

        return items.reduce(
            async (promise: PhysicalItemAvant<null>[] | Promise<PhysicalItemAvant<null>[]>, item, index) => {
                const prepared = await promise;
                const clone = item.clone({ _id: fu.randomID(), system: { size } }, { keepId: true });
                const entry = entries[index];
                if (clone.isOfType("physical")) {
                    clone.updateSource({
                        "system.quantity": entry.quantity,
                        "system.containerId": options.containerId,
                    });
                }

                if (clone.isOfType("backpack") && entry.items) {
                    const contents = await this.createGrantedItems({
                        entries: Object.values(entry.items),
                        containerId: clone.id,
                        size,
                    });
                    prepared.push(clone, ...contents);
                } else if (clone.isOfType("kit")) {
                    const inflatedKit = await clone.createGrantedItems({ containerId: options.containerId, size });
                    prepared.push(...inflatedKit);
                } else if (clone.isOfType("physical")) {
                    prepared.push(clone);
                }

                return prepared;
            },
            [],
        );
    }

    protected override async _preUpdate(
        changed: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<TParent>,
        user: UserAvant,
    ): Promise<boolean | void> {
        if (!changed.system) {
            return await super._preUpdate(changed, operation, user);
        }

        // Clear 0 price denominations
        if (isObject<Record<string, unknown>>(changed.system.price)) {
            const price: Record<string, unknown> = changed.system.price;
            for (const denomination of DENOMINATIONS) {
                if (price[denomination] === 0) {
                    price[`-=denomination`] = null;
                }
            }
        }

        return super._preUpdate(changed, operation, user);
    }
}

interface KitAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    readonly _source: KitSource;
    system: KitSystemData;
}

export { KitAvant };
