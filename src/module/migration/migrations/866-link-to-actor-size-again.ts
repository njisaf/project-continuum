import type { ActorAvant } from "@actor";
import type { ActorSourceAvant } from "@actor/data/index.ts";
import { SIZE_LINKABLE_ACTOR_TYPES } from "@actor/values.ts";
import { MigrationBase } from "../base.ts";

export class Migration866LinkToActorSizeAgain extends MigrationBase {
    static override version = 0.866;

    override async updateActor(actorSource: ActorSourceAvant): Promise<void> {
        if (SIZE_LINKABLE_ACTOR_TYPES.has(actorSource.type)) return;

        if (actorSource.prototypeToken.flags.avant) {
            actorSource.prototypeToken.flags.avant.linkToActorSize = false;
            actorSource.prototypeToken.flags.avant.autoscale = false;
        }
    }

    override async updateToken(tokenSource: foundry.documents.TokenSource, actor: ActorAvant | null): Promise<void> {
        if (!actor || SIZE_LINKABLE_ACTOR_TYPES.has(actor.type)) {
            return;
        }

        fu.mergeObject(tokenSource.flags, {
            avant: {
                linkToActorSize: false,
                autoscale: false,
            },
        });
    }
}
