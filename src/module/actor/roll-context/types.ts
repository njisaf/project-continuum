import type { ActorAvant } from "@actor";
import type { StrikeData } from "@actor/data/base.ts";
import type { ModifierAvant } from "@actor/modifiers.ts";
import type { ItemAvant } from "@item";
import type { AbilityTrait } from "@item/ability/types.ts";
import type { CheckContextChatFlag } from "@module/chat-message/data.ts";
import type { TokenDocumentAvant } from "@scene";
import type { CheckDC, DegreeOfSuccessString } from "@system/degree-of-success.ts";
import type { Statistic } from "@system/statistic/statistic.ts";

interface OpposingActorConstructorData<
    TActor extends ActorAvant | null = ActorAvant | null,
    TStatistic extends Statistic | StrikeData | null = Statistic | StrikeData | null,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> {
    actor?: TActor;
    /** The statistic used for the roll */
    statistic?: TStatistic | null;
    token?: TokenDocumentAvant | null;
    item?: TItem;
}

interface OpposingActorData<
    TActor extends ActorAvant | null,
    TStatistic extends Statistic | StrikeData | null,
    TItem extends ItemAvant<ActorAvant> | null,
> extends Required<OpposingActorConstructorData<TActor, TStatistic, TItem>> {}

interface UnresolvedOpposingActors<
    TStatistic extends Statistic | StrikeData | null,
    TItem extends ItemAvant<ActorAvant> | null,
> {
    origin: OpposingActorData<ActorAvant | null, TStatistic | null, TItem | null> | null;
    target: OpposingActorData<ActorAvant | null, TStatistic | null, TItem | null> | null;
}

interface RollOrigin<
    TActor extends ActorAvant | null = ActorAvant | null,
    TStatistic extends Statistic | StrikeData | null = Statistic | StrikeData | null,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> {
    actor: TActor;
    token: TokenDocumentAvant | null;
    /** The statistic in use if the origin is rolling */
    statistic: TStatistic | null;
    /** Whether the origin is also the roller: usually the case unless a saving throw */
    self: boolean;
    /** The item used for the strike */
    item: TItem;
    /** Bonuses and penalties added at the time of a check */
    modifiers: ModifierAvant[];
}

interface RollTarget {
    actor: ActorAvant | null;
    token: TokenDocumentAvant | null;
    /** The statistic in use if the target is rolling */
    statistic: Statistic | null;
    /** Whether the target is also the roller: usually not the case unless a saving throw */
    self: boolean;
    item: ItemAvant<ActorAvant> | null;
    distance: number | null;
    rangeIncrement: number | null;
}

/** Context for the attack or damage roll of a strike */
interface RollContextData<
    TActor extends ActorAvant | null = ActorAvant | null,
    TStatistic extends Statistic | StrikeData | null = Statistic | StrikeData | null,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> {
    /** Roll option domains */
    domains: string[];
    /** Roll options */
    options: Set<string>;
    origin: RollOrigin<TActor, TStatistic, TItem> | null;
    target: RollTarget | null;
    traits: AbilityTrait[];
}

interface CheckContextData<
    TActor extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> extends RollContextData<TActor, TStatistic, TItem> {
    dc: CheckDC | null;
}

interface BaseConstructorParams<
    TSelf extends ActorAvant,
    TStatistic extends Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null,
> {
    /** An origin actor and token: required for most checks, optional for saving throws */
    origin?: OpposingActorConstructorData<TSelf | ActorAvant | null, TStatistic | null, TItem | null> | null;
    /** A targeted actor and token: may not be applicable if the action doesn't take targets */
    target?: OpposingActorConstructorData<TSelf | ActorAvant | null, TStatistic | null, TItem | null> | null;
    /** Domains from which to draw roll options */
    domains: string[];
    /** Initial roll options for the strike */
    options: Set<string>;
    /** Whether the request is for display in a sheet view. If so, targets are not considered */
    viewOnly?: boolean;
    /** Action traits associated with the roll */
    traits?: AbilityTrait[];
}

interface ConstructorParamsSelfIsOrigin<
    TSelf extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> extends BaseConstructorParams<TSelf, TStatistic, TItem> {
    origin: OpposingActorConstructorData<TSelf, TStatistic, TItem>;
    target?: OpposingActorConstructorData<ActorAvant | null, null, null> | null;
}

interface ConstructorParamsSelfIsTarget<
    TSelf extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> extends BaseConstructorParams<TSelf, TStatistic, TItem> {
    origin?: OpposingActorConstructorData<ActorAvant | null, null, TItem> | null;
    target: OpposingActorConstructorData<TSelf, TStatistic, null>;
}

type RollContextConstructorParams<
    TSelf extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> = ConstructorParamsSelfIsOrigin<TSelf, TStatistic, TItem> | ConstructorParamsSelfIsTarget<TSelf, TStatistic, TItem>;

type CheckContextConstructorParams<
    TSelf extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> = RollContextConstructorParams<TSelf, TStatistic, TItem> & {
    against?: string | null;
};

type DamageContextConstructorParams<
    TSelf extends ActorAvant = ActorAvant,
    TStatistic extends Statistic | StrikeData = Statistic | StrikeData,
    TItem extends ItemAvant<ActorAvant> | null = ItemAvant<ActorAvant> | null,
> = RollContextConstructorParams<TSelf, TStatistic, TItem> & {
    /** The context object of the preceding check roll */
    checkContext: Maybe<CheckContextChatFlag>;
    /**
     * An outcome of a preceding check roll:
     * This may be different than what is in the context object if the user rolled damage despite a failure
     */
    outcome: Maybe<DegreeOfSuccessString>;
};

export type {
    CheckContextConstructorParams,
    CheckContextData,
    DamageContextConstructorParams,
    RollContextConstructorParams,
    RollContextData,
    RollOrigin,
    RollTarget,
    UnresolvedOpposingActors,
};
