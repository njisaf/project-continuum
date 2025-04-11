import { AmbientLightDocumentAvant } from "@scene/index.ts";
import { LightingLayerAvant } from "./index.ts";

class AmbientLightAvant<
    TDocument extends AmbientLightDocumentAvant = AmbientLightDocumentAvant,
> extends AmbientLight<TDocument> {
    // Still exists if we need it later, but slated for removal once V12 is fully out
}

interface AmbientLightAvant<TDocument extends AmbientLightDocumentAvant = AmbientLightDocumentAvant>
    extends AmbientLight<TDocument> {
    get layer(): LightingLayerAvant<this>;
}

export { AmbientLightAvant };
