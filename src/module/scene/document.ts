import { LightLevels, SceneFlagsAvant } from "./data.ts";
import { checkAuras } from "./helpers.ts";
import type {
    AmbientLightDocumentAvant,
    MeasuredTemplateDocumentAvant,
    RegionDocumentAvant,
    TileDocumentAvant,
} from "./index.ts";
import { TokenDocumentAvant } from "./index.ts";
import type { SceneConfigAvant } from "./sheet.ts";

class SceneAvant extends Scene {
    /** Has this document completed `DataModel` initialization? */
    declare initialized: boolean;

    /** Is the rules-based vision setting enabled? */
    get rulesBasedVision(): boolean {
        if (!this.tokenVision) return false;
        return this.flags.avant.rulesBasedVision ?? game.avant.settings.rbv;
    }

    get hearingRange(): number | null {
        return this.flags.avant.hearingRange;
    }

    /** Is this scene's darkness value synced to the world time? */
    get darknessSyncedToTime(): boolean {
        return (
            this.flags.avant.syncDarkness === "enabled" ||
            (this.flags.avant.syncDarkness === "default" && game.settings.get("avant", "worldClock.syncDarkness"))
        );
    }

    get lightLevel(): number {
        return 1 - this.environment.darknessLevel;
    }

    get isBright(): boolean {
        return this.lightLevel >= LightLevels.BRIGHT_LIGHT;
    }

    get isDimlyLit(): boolean {
        return !this.isBright && !this.isDark;
    }

    get isDark(): boolean {
        return this.lightLevel <= LightLevels.DARKNESS;
    }

    /** Whether this scene is "in focus": the active scene, or the viewed scene if only a single GM is logged in */
    get isInFocus(): boolean {
        const soleUserIsGM = game.user.isGM && game.users.filter((u) => u.active).length === 1;
        return (this.active && !soleUserIsGM) || (this.isView && soleUserIsGM);
    }

    protected override _initialize(options?: Record<string, unknown>): void {
        this.initialized = false;
        super._initialize(options);
    }

    /**
     * Prevent double data preparation of child documents.
     * @removeme in V13
     */
    override prepareData(): void {
        if (game.release.generation === 12 && this.initialized) return;
        this.initialized = true;
        super.prepareData();

        Promise.resolve().then(() => {
            this.checkAuras();
        });
    }

    /** Toggle Unrestricted Global Vision according to scene darkness level */
    override prepareBaseData(): void {
        super.prepareBaseData();

        this.flags.avant = fu.mergeObject(
            {
                hearingRange: null,
                rulesBasedVision: null,
                syncDarkness: "default",
            },
            this.flags.avant ?? {},
        );

        if (this.rulesBasedVision) {
            this.environment.globalLight.enabled = true;
            this.environment.globalLight.darkness.max = 1 - (LightLevels.DARKNESS + 0.001);
        }
    }

    /** Check for tokens that moved into or out of difficult terrain and reset their respective actors */
    #refreshTerrainAwareness(): void {
        if (this.regions.some((r) => r.behaviors.some((b) => !b.disabled && b.type === "environmentFeature"))) {
            for (const token of this.tokens.filter((t) => t.isLinked)) {
                const rollOptionsAll = token.actor?.rollOptions.all ?? {};
                const actorDifficultTerrain = rollOptionsAll["self:position:difficult-terrain"]
                    ? rollOptionsAll["self:position:difficult-terrain:greater"]
                        ? 2
                        : 1
                    : 0;
                if (actorDifficultTerrain !== token.difficultTerrain) {
                    token.actor?.reset();
                }
            }
        }
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    override _onUpdate(changed: DeepPartial<this["_source"]>, operation: SceneUpdateOperation, userId: string): void {
        super._onUpdate(changed, operation, userId);

        const flagChanges = changed.flags?.avant ?? {};
        if (this.isView && ["rulesBasedVision", "hearingRange"].some((k) => flagChanges[k] !== undefined)) {
            canvas.perception.update({ initializeLighting: true, initializeVision: true });
        }

        if (changed.active === true || (this.active && changed.flags?.avant?.environmentTypes)) {
            this.#refreshTerrainAwareness();
        }

        // Check if this is the new active scene or an update to an already active scene
        if (changed.active !== false && canvas.scene === this) {
            for (const token of canvas.tokens.placeables) {
                token.auras.reset();
            }
        }
    }

    protected override _onUpdateDescendantDocuments(
        parent: this,
        collection: string,
        documents: ClientDocument[],
        changes: object[],
        options: DatabaseUpdateOperation<this>,
        userId: string,
    ): void {
        super._onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);

        if (["behaviors", "regions", "tokens"].includes(collection)) {
            this.#refreshTerrainAwareness();
        }
    }

    protected override _onDeleteDescendantDocuments(
        parent: this,
        collection: string,
        documents: foundry.abstract.Document[],
        ids: string[],
        operation: DatabaseDeleteOperation<this>,
        userId: string,
    ): void {
        super._onDeleteDescendantDocuments(parent, collection, documents, ids, operation, userId);

        // Upstream will only refresh lighting if the delete token's source is emitting light: handle cases where
        // the token's prepared data light data was overridden from TokenLight REs.
        const tokensHadSyntheticLights = documents.some(
            (d) =>
                d instanceof TokenDocumentAvant &&
                !(d._source.light.dim || d._source.light.bright) &&
                d.actor?.synthetics.tokenOverrides.light,
        );
        if (tokensHadSyntheticLights) {
            canvas.perception.update({ initializeLighting: true, initializeVision: true });
        }
    }
}

interface SceneAvant extends Scene {
    flags: SceneFlagsAvant;

    /** Check for auras containing newly-placed or moved tokens (added as a debounced method) */
    checkAuras(): void;

    readonly lights: foundry.abstract.EmbeddedCollection<AmbientLightDocumentAvant<this>>;
    readonly regions: foundry.abstract.EmbeddedCollection<RegionDocumentAvant<this>>;
    readonly templates: foundry.abstract.EmbeddedCollection<MeasuredTemplateDocumentAvant<this>>;
    readonly tiles: foundry.abstract.EmbeddedCollection<TileDocumentAvant<this>>;
    readonly tokens: foundry.abstract.EmbeddedCollection<TokenDocumentAvant<this>>;

    get sheet(): SceneConfigAvant<this>;
}

// Added as debounced method
Object.defineProperty(SceneAvant.prototype, "checkAuras", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: checkAuras,
});

export { SceneAvant };
