import type { ActorAvant } from "@actor";
import type { ShieldAvant } from "./document.ts";

function setActorShieldData(shield: ShieldAvant<ActorAvant>): void {
    const { actor } = shield;
    const isEquippedShield = shield.isEquipped && actor.heldShield === shield;
    if (!isEquippedShield || !actor.isOfType("character", "npc")) {
        return;
    }
    const { attributes } = actor.system;
    if (![shield.id, null].includes(attributes.shield.itemId)) {
        return;
    }

    const { hitPoints } = shield;
    attributes.shield = {
        itemId: shield.id,
        name: shield.name,
        ac: shield.acBonus,
        hp: hitPoints,
        hardness: shield.hardness,
        brokenThreshold: hitPoints.brokenThreshold,
        raised: shield.isRaised,
        broken: shield.isBroken,
        destroyed: shield.isDestroyed,
        icon: shield.img,
    };
    actor.rollOptions.all["self:shield:equipped"] = true;
    if (shield.isDestroyed) {
        actor.rollOptions.all["self:shield:destroyed"] = true;
    } else if (shield.isBroken) {
        actor.rollOptions.all["self:shield:broken"] = true;
    }
}

export { setActorShieldData };
