import { ItemAvant } from "@item";
import { EffectContextData } from "@item/abstract-effect/index.ts";

type DropCanvasItemDataAvant = DropCanvasData<"Item", ItemAvant> & {
    value?: number;
    level?: number;
    spellFrom?: {
        collectionId: string;
        groupId: string;
        slotIndex: number;
    };
    context?: EffectContextData;
};

type DropCanvasPersistentDamage = DropCanvasData<"PersistentDamage"> & {
    formula: string;
};

type DropCanvasDataAvant = DropCanvasItemDataAvant | DropCanvasPersistentDamage;

export type { DropCanvasDataAvant, DropCanvasItemDataAvant };
