import type { SceneAvant } from "./document.ts";

export class TileDocumentAvant<TParent extends SceneAvant | null = SceneAvant | null> extends TileDocument<TParent> {}
