import { AmbientLightAvant } from "../ambient-light.ts";

export class LightingLayerAvant<
    TAmbientLight extends AmbientLightAvant = AmbientLightAvant,
> extends LightingLayer<TAmbientLight> {
    get lightingLevel(): number {
        return 1 - canvas.darknessLevel;
    }
}
