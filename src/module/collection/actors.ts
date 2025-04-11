import { ActorAvant, PartyAvant } from "@actor";

export class ActorsAvant<TActor extends ActorAvant<null>> extends Actors<TActor> {
    /** The world's active party, if one exists */
    get party(): PartyAvant<null> | null {
        const activePartyId = game.settings.get("avant", "activeParty");
        const actor = this.get(activePartyId);
        return actor?.isOfType("party")
            ? actor
            : ((this as Actors<ActorAvant<null>>).find<PartyAvant<null>>((a) => a.isOfType("party")) ?? null);
    }

    /** Overrwriten to omit actors in parties, which are rendered separately */
    override _getVisibleTreeContents(): TActor[] {
        return super
            ._getVisibleTreeContents()
            .filter((a) => (a.isOfType("creature") && !a.parties.size) || !a.isOfType("party", "creature"));
    }
}
