import type { ActorAvant } from "@actor";
import type { AbstractEffectAvant, ItemAvant } from "@item";
import * as R from "remeda";
import type { EffectDurationSource } from "types/foundry/common/documents/active-effect.d.ts";

export class ActiveEffectAvant<TParent extends ActorAvant | ItemAvant | null> extends ActiveEffect<TParent> {
    /** Create an active effect from an (abstract) effect for use in token effect icons */
    static fromEffect<TActor extends ActorAvant>(effect: AbstractEffectAvant<TActor>): ActiveEffectAvant<TActor> {
        const isEffect = effect.isOfType("effect");
        const isCondition = effect.isOfType("condition");

        const duration: EffectDurationSource = {
            seconds: null,
            rounds: isEffect && effect.system.duration.unit === "rounds" ? effect.system.duration.value : null,
            turns: null,
            combat: effect.actor.combatant?.encounter._id ?? null,
            startTime: isEffect ? effect.system.start.value : null,
            startRound: null,
            startTurn: isEffect ? effect.system.start.initiative : null,
        };

        return new this(
            {
                name: effect.name,
                img: effect.img,
                system: {},
                description: effect.system.description.value,
                disabled: isCondition ? !effect.active : false,
                duration,
                origin: effect.uuid,
                transfer: true,
                statuses: [effect.slug].filter(R.isTruthy),
                flags: fu.deepClone(effect.flags),
                _stats: fu.deepClone(effect._stats),
            },
            { parent: effect.actor },
        );
    }

    protected override async _preCreate(
        data: this["_source"],
        operation: DatabaseCreateOperation<TParent>,
        user: User,
    ): Promise<boolean | void> {
        // Only allow the death overlay effect
        if (!data.statuses.includes("dead")) return false;

        return super._preCreate(data, operation, user);
    }
}
