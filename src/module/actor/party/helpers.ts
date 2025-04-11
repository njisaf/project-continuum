import { ActorAvant } from "@actor";

/** Create the first party actor in this (typically new) world */
async function createFirstParty(): Promise<void> {
    if (game.user !== game.users.activeGM || game.settings.get("avant", "createdFirstParty")) {
        return;
    }

    if (!game.actors.some((a) => a.isOfType("party"))) {
        await ActorAvant.create(
            {
                _id: CONFIG.AVANT.defaultPartyId,
                type: "party",
                name: game.i18n.localize("AVANT.Actor.Party.DefaultName"),
            },
            { keepId: true },
        );
        await game.settings.set("avant", "activeParty", CONFIG.AVANT.defaultPartyId);
    }

    await game.settings.set("avant", "createdFirstParty", true);
}

export { createFirstParty };
