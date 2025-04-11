import type { UserAvant } from "@module/user/document.ts";
import type {
    EnvironmentBehaviorType,
    EnvironmentFeatureBehaviorType,
    RegionBehaviorAvant,
    RegionDocumentAvant,
} from "@scene";
import type { DIFFICULT_TERRAIN_GRADES } from "./values.ts";
import coreBehaviors = foundry.data.regionBehaviors;

type RegionEventAvant = RegionEvent<RegionDocumentAvant, UserAvant>;

interface AdjustDarknessLevelRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "adjustDarknessLevel";
    system: coreBehaviors.AdjustDarknessLevelRegionBehaviorType;
}

interface ExecuteMacroRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "executeMacro";
    system: coreBehaviors.ExecuteMacroRegionBehaviorType;
}

interface ExecuteScriptRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "executeScript";
    system: coreBehaviors.ExecuteScriptRegionBehaviorType;
}

interface PauseGameRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "pauseGame";
    system: coreBehaviors.PauseGameRegionBehaviorType;
}

interface SuppressWeatherRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "suppressWeather";
    system: coreBehaviors.SuppressWeatherRegionBehaviorType;
}

interface TeleportTokenRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "teleportToken";
    system: coreBehaviors.TeleportTokenRegionBehaviorType;
}

interface ToggleBehaviorRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "toggleBehavior";
    system: coreBehaviors.ToggleBehaviorRegionBehaviorType;
}

interface EnvironmentRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "environment";
    system: EnvironmentBehaviorType;
}

interface EnvironmentFeatureRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null>
    extends RegionBehaviorAvant<TParent> {
    type: "environmentFeature";
    system: EnvironmentFeatureBehaviorType;
}

type SpecificRegionBehavior<TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null> =
    | AdjustDarknessLevelRegionBehavior<TParent>
    | ExecuteMacroRegionBehavior<TParent>
    | ExecuteScriptRegionBehavior<TParent>
    | PauseGameRegionBehavior<TParent>
    | SuppressWeatherRegionBehavior<TParent>
    | TeleportTokenRegionBehavior<TParent>
    | ToggleBehaviorRegionBehavior<TParent>
    | EnvironmentRegionBehavior<TParent>
    | EnvironmentFeatureRegionBehavior<TParent>;

type DifficultTerrainGrade = (typeof DIFFICULT_TERRAIN_GRADES)[keyof typeof DIFFICULT_TERRAIN_GRADES];

export type {
    DifficultTerrainGrade,
    EnvironmentFeatureRegionBehavior,
    EnvironmentRegionBehavior,
    RegionEventAvant,
    SpecificRegionBehavior,
};
