import {
    AmbientLightDocumentAvant,
    MeasuredTemplateDocumentAvant,
    RegionDocumentAvant,
    SceneAvant,
    TokenDocumentAvant,
} from "@scene/index.ts";
import { AmbientLightAvant } from "./ambient-light.ts";
import { EffectsCanvasGroupAvant } from "./group/effects.ts";
import { LightingLayerAvant } from "./layer/lighting.ts";
import { TemplateLayerAvant } from "./layer/template.ts";
import { TokenLayerAvant } from "./layer/token.ts";
import { MeasuredTemplateAvant } from "./measured-template.ts";
import { RegionAvant } from "./region.ts";
import { RulerAvant } from "./ruler.ts";
import { TokenAvant } from "./token/object.ts";

export type CanvasAvant = Canvas<
    SceneAvant,
    AmbientLightAvant<AmbientLightDocumentAvant<SceneAvant>>,
    MeasuredTemplateAvant<MeasuredTemplateDocumentAvant<SceneAvant>>,
    TokenAvant<TokenDocumentAvant<SceneAvant>>,
    EffectsCanvasGroupAvant,
    RegionAvant<RegionDocumentAvant<SceneAvant>>,
    RulerAvant
>;

export * from "./helpers.ts";
export {
    AmbientLightAvant,
    EffectsCanvasGroupAvant,
    LightingLayerAvant,
    MeasuredTemplateAvant,
    RegionAvant,
    RulerAvant,
    TemplateLayerAvant,
    TokenLayerAvant,
    TokenAvant,
};
