import type { ActorAvant } from "@actor";
import { PhysicalItemAvant } from "@item";
import type { EquipmentTrait } from "@item/equipment/types.ts";
import type { BookSource, BookSystemData } from "./data.ts";

class BookAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    static override get validTraits(): Record<EquipmentTrait, string> {
        return CONFIG.AVANT.equipmentTraits;
    }
}

interface BookAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    readonly _source: BookSource;
    system: BookSystemData;
}

export { BookAvant };
