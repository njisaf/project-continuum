import type { ActorAvant } from "@actor";
import { transferItemsBetweenActors } from "@actor/helpers.js";
import { ErrorAvant } from "@util";

class LootNPCsPopup extends FormApplication<ActorAvant> {
    static override get defaultOptions(): FormApplicationOptions {
        const options = super.defaultOptions;
        options.id = "loot-NPCs";
        options.classes = [];
        options.title = "Loot NPCs";
        options.template = "systems/avant/templates/actors/loot/loot-npcs-popup.hbs";
        options.width = "auto";
        return options;
    }

    override async getData(): Promise<PopupData> {
        const selectedTokens = canvas.ready
            ? canvas.tokens.controlled.filter((t) => t.actor && t.actor.id !== this.object.id)
            : [];
        const tokenInfo = selectedTokens.map((t) => ({
            id: t.id,
            name: t.name,
            checked: t.actor?.hasPlayerOwner ?? false,
        }));
        return { ...(await super.getData()), tokenInfo };
    }

    override async _updateObject(
        _event: Event,
        formData: Record<string, unknown> & { selection?: boolean },
    ): Promise<void> {
        if (!canvas.ready) return;

        const lootActor = this.object;
        const selectionData = Array.isArray(formData.selection) ? formData.selection : [formData.selection];

        for (let i = 0; i < selectionData.length; i++) {
            const token = canvas.tokens.placeables.find((token) => token.actor && token.id === this.form[i]?.id);
            if (!token) {
                throw ErrorAvant(`Token ${this.form[i]?.id} not found`);
            }

            if (selectionData[i] && token.actor) {
                await transferItemsBetweenActors(token.actor, lootActor);
            }
        }
    }
}

interface PopupData extends FormApplicationData<ActorAvant> {
    tokenInfo: {
        id: string;
        name: string;
        checked: boolean;
    }[];
}

export { LootNPCsPopup };
