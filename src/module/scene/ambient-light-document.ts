import type { AmbientLightAvant } from "@module/canvas/index.ts";
import type { SceneAvant } from "./index.ts";

class AmbientLightDocumentAvant<
    TParent extends SceneAvant | null = SceneAvant | null,
> extends AmbientLightDocument<TParent> {
    // Still exists if we need it later, but slated for removal once V12 is fully out
}

interface AmbientLightDocumentAvant<TParent extends SceneAvant | null = SceneAvant | null>
    extends AmbientLightDocument<TParent> {
    get object(): AmbientLightAvant<this> | null;
}

export { AmbientLightDocumentAvant };
