import type { ActorAvant } from "@actor";
import type { SceneAvant } from "@scene";

export class MockToken {
    actor: ActorAvant | null;
    readonly parent: SceneAvant | null;
    readonly _source: foundry.documents.TokenSource;

    constructor(
        data: foundry.documents.TokenSource,
        context: { parent?: SceneAvant | null; actor?: ActorAvant | null } = {},
    ) {
        this._source = fu.duplicate(data);
        this.parent = context.parent ?? null;
        this.actor = context.actor ?? null;
    }

    get id(): string {
        return this._source._id ?? "";
    }

    get name(): string {
        return this._source.name;
    }

    get scene(): this["parent"] {
        return this.parent;
    }

    update(
        changes: EmbeddedDocumentUpdateData,
        context: Partial<DatabaseUpdateOperation<NonNullable<this["parent"]>>> = {},
    ): void {
        changes._id = this.id;
        this.scene?.updateEmbeddedDocuments("Token", [changes], context);
    }
}
