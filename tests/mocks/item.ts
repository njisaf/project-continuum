import type { ActorAvant } from "@actor/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { ItemSystemSource } from "@item/base/data/system.ts";
import type { ItemAvant } from "@item/index.ts";

export class MockItem {
    readonly _source: ItemSourceAvant;

    readonly parent: ActorAvant | null;

    constructor(
        data: ItemSourceAvant,
        public options: DocumentConstructionContext<ActorAvant | null> = {},
    ) {
        this._source = fu.duplicate(data);
        this.parent = options.parent ?? null;
    }

    get id(): string | null {
        return this._source._id;
    }

    get name(): string {
        return this._source.name;
    }

    get system(): ItemSystemSource {
        return this._source.system;
    }

    get level(): number | null {
        return this.system.level?.value ?? null;
    }

    get traits(): Set<string> {
        return new Set(this.system.traits?.value ?? []);
    }

    get isMagical(): boolean {
        return ["magical", "arcane", "primal", "divine", "occult"].some((trait) => this.traits.has(trait));
    }

    get isAlchemical(): boolean {
        return this.traits.has("alchemical");
    }

    static async updateDocuments(
        updates: Record<string, unknown>[] = [],
        _operation: Partial<DatabaseUpdateOperation<ActorAvant | null>> = {},
    ): Promise<ItemAvant<ActorAvant | null>[]> {
        return updates.flatMap((update) => {
            const item = game.items.find((item) => item.id === update._id);
            if (item) fu.mergeObject(item._source, update, { performDeletions: true });
            return item ?? [];
        });
    }

    update(changes: object): void {
        fu.mergeObject(this._source, changes, { performDeletions: true });
    }

    toObject(): ItemSourceAvant {
        return fu.duplicate(this._source);
    }
}
