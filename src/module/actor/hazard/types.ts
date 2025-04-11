import type { HazardAvant } from "@actor";
import { TraitViewData } from "@actor/data/base.ts";
import { ActorSheetDataAvant } from "@actor/sheet/data-types.ts";
import { SaveType } from "@actor/types.ts";
import type { AbilityItemAvant } from "@item";

interface HazardSheetData extends ActorSheetDataAvant<HazardAvant> {
    actions: HazardActionSheetData;
    complexityOptions: FormSelectOption[];
    emitsSoundOptions: FormSelectOption[];
    editing: boolean;
    actorTraits: TraitViewData[];
    rarity: Record<string, string>;
    rarityLabel: string;
    brokenThreshold: number;
    saves: HazardSaveSheetData[];
    hasDefenses: boolean;
    hasHPDetails: boolean;
    hasSaves: boolean;
    hasIWR: boolean;
    hasStealth: boolean;
    hasDescription: boolean;
    hasDisable: boolean;
    hasRoutineDetails: boolean;
    hasResetDetails: boolean;
}

interface HazardActionSheetData {
    reaction: AbilityItemAvant[];
    action: AbilityItemAvant[];
}

interface HazardSaveSheetData {
    label: string;
    type: SaveType;
    mod?: number;
}

type HazardTrait = keyof ConfigAvant["AVANT"]["hazardTraits"];

export type { HazardActionSheetData, HazardSaveSheetData, HazardSheetData, HazardTrait };
