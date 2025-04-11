import type { ActorAvant } from "@actor";
import { createPonderousPenalty } from "@actor/character/helpers.ts";
import { InitiativeData } from "@actor/data/base.ts";
import { ZeroToTwo } from "@module/data.ts";
import { CombatantAvant, EncounterAvant } from "@module/encounter/index.ts";
import { CheckRoll } from "@system/check/index.ts";
import { Statistic, StatisticData, StatisticRollParameters, StatisticTraceData } from "@system/statistic/index.ts";
import { AttributeString } from "./types.ts";

interface InitiativeRollResult {
    combatant: CombatantAvant<EncounterAvant>;
    roll: Rolled<CheckRoll>;
}

interface InitiativeRollParams extends StatisticRollParameters {
    combatant?: CombatantAvant<EncounterAvant>;
    /** Whether the encounter tracker should be updated with the roll result */
    updateTracker?: boolean;
}

/** A statistic wrapper used to roll initiative for actors */
class ActorInitiative {
    actor: ActorAvant;

    statistic: Statistic;

    tiebreakPriority: ZeroToTwo;

    constructor(actor: ActorAvant, { statistic, tiebreakPriority }: { statistic: string; tiebreakPriority: ZeroToTwo }) {
        this.actor = actor;
        this.tiebreakPriority = tiebreakPriority;

        const base = actor.getStatistic(statistic);
        const ponderousPenalty = actor.isOfType("character") ? createPonderousPenalty(actor) : null;
        const rollLabel = game.i18n.format("AVANT.InitiativeWithSkill", { skillName: base?.label ?? "" });

        const data: StatisticData = {
            slug: "initiative",
            label: base?.label ?? "AVANT.InitiativeLabel",
            domains: ["initiative"],
            rollOptions: [base?.slug ?? []].flat(),
            check: { type: "initiative", label: rollLabel },
            modifiers: [ponderousPenalty ?? []].flat(),
        };

        this.statistic = base ? base.extend(data) : new Statistic(actor, data);
    }

    get attribute(): AttributeString | null {
        return this.statistic.attribute;
    }

    get mod(): number {
        return this.statistic.check.mod;
    }

    async roll(args: InitiativeRollParams = {}): Promise<InitiativeRollResult | null> {
        // Get or create the combatant
        const combatant =
            args.combatant?.actor === this.actor ? args.combatant : await CombatantAvant.fromActor(this.actor, false);
        if (!combatant) return null;

        if (combatant.hidden) {
            args.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
        }

        const roll = await this.statistic.roll(args);
        if (!roll) {
            // Render combat sidebar in case a combatant was created but the roll was not completed
            game.combats.render(false);
            return null;
        }

        // Update the tracker unless requested not to
        const updateTracker = args.updateTracker ?? true;
        if (updateTracker) {
            combatant.encounter.setInitiative(combatant.id, roll.total, this.statistic.base?.slug);
        }

        return { combatant, roll };
    }

    getTraceData(): InitiativeTraceData {
        const initiativeData = this.actor.system.initiative;

        return {
            ...this.statistic.getTraceData(),
            statistic: initiativeData?.statistic ?? "perception",
            tiebreakPriority: this.tiebreakPriority,
        };
    }
}

type InitiativeTraceData = StatisticTraceData & InitiativeData;

export { ActorInitiative };
export type { InitiativeRollResult, InitiativeTraceData };
