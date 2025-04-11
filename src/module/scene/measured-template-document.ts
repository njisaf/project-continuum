import { ActorAvant } from "@actor";
import { ItemAvant } from "@item";
import type { EffectAreaShape } from "@item/spell/types.ts";
import type { MeasuredTemplateAvant } from "@module/canvas/measured-template.ts";
import { ItemOriginFlag } from "@module/chat-message/data.ts";
import type { ChatMessageAvant } from "@module/chat-message/document.ts";
import { toggleClearTemplatesButton } from "@module/chat-message/helpers.ts";
import type { SceneAvant } from "./document.ts";

class MeasuredTemplateDocumentAvant<
    TParent extends SceneAvant | null = SceneAvant | null,
> extends MeasuredTemplateDocument<TParent> {
    get actor(): ActorAvant | null {
        const uuid = this.flags.avant?.origin?.actor;
        if (!uuid) return null;
        const document = fromUuidSync(uuid);
        return document instanceof ActorAvant ? document : (this.item?.actor ?? null);
    }

    get item(): ItemAvant<ActorAvant> | null {
        const origin = this.flags.avant?.origin;
        const uuid = origin?.uuid;
        if (!uuid) return null;
        const item = fromUuidSync(uuid as string);
        if (!(item instanceof ItemAvant)) return null;

        if (item?.isOfType("spell")) {
            const overlayIds = origin?.variant?.overlays;
            const castRank = (origin?.castRank ?? item.rank) as number;
            const modifiedSpell = item.loadVariant({ overlayIds, castRank: castRank });
            return modifiedSpell ?? item;
        }

        return item;
    }

    /** The chat message from which this template was spawned */
    get message(): ChatMessageAvant | null {
        return game.messages.get(this.flags.avant?.messageId ?? "") ?? null;
    }

    get areaShape(): EffectAreaShape | null {
        return this.flags.avant.areaShape;
    }

    /** Ensure the source has a `avant` flag along with an `areaShape` if directly inferable. */
    protected override _initializeSource(
        data: object,
        options?: DataModelConstructionOptions<TParent>,
    ): this["_source"] {
        const initialized = super._initializeSource(data, options);
        const areaShape = initialized.t === "cone" ? "cone" : initialized.t === "ray" ? "line" : null;
        initialized.flags.avant = fu.mergeObject({ areaShape }, initialized.flags.avant ?? {});
        return initialized;
    }

    /** If present, show the clear-template button on the message from which this template was spawned */
    protected override _onCreate(
        data: this["_source"],
        operation: DatabaseCreateOperation<TParent>,
        userId: string,
    ): void {
        super._onCreate(data, operation, userId);
        toggleClearTemplatesButton(this.message);
    }

    /** If present, hide the clear-template button on the message from which this template was spawned */
    protected override _onDelete(operation: DatabaseDeleteOperation<TParent>, userId: string): void {
        super._onDelete(operation, userId);
        toggleClearTemplatesButton(this.message);
    }
}

interface MeasuredTemplateDocumentAvant<TParent extends SceneAvant | null = SceneAvant | null>
    extends MeasuredTemplateDocument<TParent> {
    get object(): MeasuredTemplateAvant<this> | null;

    flags: DocumentFlags & {
        avant: {
            messageId?: string;
            origin?: ItemOriginFlag;
            areaShape: EffectAreaShape | null;
        };
    };
}

export { MeasuredTemplateDocumentAvant };
