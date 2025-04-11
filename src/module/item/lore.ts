import type { ActorAvant } from "@actor";
import { ItemAvant, ItemSheetAvant } from "@item";
import { BaseItemSourceAvant, ItemSystemData, ItemSystemSource, OtherTagsOnly } from "@item/base/data/system.ts";
import { ZeroToFour } from "@module/data.ts";

class LoreAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {}

interface LoreAvant<TParent extends ActorAvant | null> extends ItemAvant<TParent> {
    readonly _source: LoreSource;
    system: LoreSystemData;
}

type LoreSource = BaseItemSourceAvant<"lore", LoreSystemSource>;

interface LoreSystemSource extends ItemSystemSource {
    traits: OtherTagsOnly;
    mod: { value: number };
    proficient: { value: ZeroToFour };
    variants?: Record<string, { label: string; options: string }>;
    level?: never;
}

interface LoreSystemData extends Omit<LoreSystemSource, "description">, ItemSystemData {
    level?: never;
    traits: OtherTagsOnly;
}

class LoreSheetAvant extends ItemSheetAvant<LoreAvant> {}

export { LoreAvant, LoreSheetAvant };
export type { LoreSource, LoreSystemData };
