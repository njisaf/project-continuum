import { Coins } from "@item/physical/data.ts";
import { ActorAvant } from "@actor";

interface PopupFormData extends Coins {
    removeByValue: boolean;
}

/**
 * @category Other
 */
export class RemoveCoinsPopup extends FormApplication<ActorAvant> {
    static override get defaultOptions(): FormApplicationOptions {
        return {
            ...super.defaultOptions,
            id: "remove-coins",
            title: "AVANT.RemoveCoinsTitle",
            template: "systems/avant/templates/actors/remove-coins.hbs",
        };
    }

    override async _updateObject(_event: Event, formData: Record<string, unknown> & PopupFormData): Promise<void> {
        const actor = this.object;
        const coinsToRemove = {
            pp: Number(formData.pp) || 0,
            gp: Number(formData.gp) || 0,
            sp: Number(formData.sp) || 0,
            cp: Number(formData.cp) || 0,
        };

        const isSuccess = await actor.inventory.removeCoins(coinsToRemove, { byValue: !!formData.removeByValue });
        if (!isSuccess) {
            ui.notifications.warn("AVANT.ErrorMessage.NotEnoughCoins", { localize: true });
        }
    }
}
