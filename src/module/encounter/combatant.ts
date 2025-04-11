import type { ActorAvant } from "@actor";
import type { SkillSlug } from "@actor/types.ts";
import type { TokenDocumentAvant } from "@scene/index.ts";
import { ErrorAvant } from "@util";
import type { CombatantSource } from "types/foundry/common/documents/combatant.d.ts";
import type { EncounterAvant } from "./index.ts";

class CombatantAvant<
    TParent extends EncounterAvant | null = EncounterAvant | null,
    TTokenDocument extends TokenDocumentAvant | null = TokenDocumentAvant | null,
> extends Combatant<TParent, TTokenDocument> {
    /** Has this document completed `DataModel` initialization? */
    declare initialized: boolean;

    static override async createDocuments<TDocument extends foundry.abstract.Document>(
        this: ConstructorOf<TDocument>,
        data?: (TDocument | PreCreate<TDocument["_source"]>)[],
        operation?: Partial<DatabaseCreateOperation<TDocument["parent"]>>,
    ): Promise<TDocument[]>;
    static override async createDocuments(
        data: (CombatantAvant | PreCreate<CombatantSource>)[] = [],
        operation: Partial<DatabaseCreateOperation<EncounterAvant>> = {},
    ): Promise<Combatant[]> {
        this.#swapPartyForMembers(data, operation);
        return super.createDocuments(data, operation);
    }

    /** Remove any party to be added to an encounter and instead add its members */
    static #swapPartyForMembers(
        data: (CombatantAvant | PreCreate<CombatantSource>)[],
        operation: Partial<DatabaseCreateOperation<EncounterAvant>>,
    ): void {
        for (const datum of [...data]) {
            const actor = game.actors.get(datum.actorId ?? "");
            const scene = game.scenes.get(datum.sceneId ?? "");
            if (!scene || !actor?.isOfType("party")) continue;
            data.findSplice((d) => d.actorId === actor.id);
            for (const member of actor.members) {
                const token = member.getDependentTokens({ scenes: [scene], linked: true }).at(0);
                const alreadyAdded = operation.parent?.combatants.some((c) => c.actor === member);
                const memberTraits = member.system.traits.value;
                const validInEncounter = !memberTraits.some((t) => ["minion", "eidolon"].includes(t));
                const alreadyBeingAdded = data.some((d) => d.actorId === member.id);
                if (token && !alreadyAdded && !alreadyBeingAdded && validInEncounter) {
                    data.push({
                        actorId: member.id,
                        sceneId: scene.id,
                        tokenId: token.id,
                        hidden: !!datum.hidden,
                    });
                }
            }
        }
    }

    /** Get the active Combatant for the given actor, creating one if necessary */
    static async fromActor(
        actor: ActorAvant,
        render = true,
        options: { combat?: EncounterAvant } = {},
    ): Promise<CombatantAvant<EncounterAvant> | null> {
        if (!game.combat) {
            ui.notifications.error(game.i18n.localize("AVANT.Encounter.NoActiveEncounter"));
            return null;
        }
        const token = actor.getActiveTokens().pop();
        const existing = game.combat.combatants.find((combatant) => combatant.actor === actor);
        if (existing) {
            return existing;
        } else if (token) {
            const combat = options.combat ?? game.combat;
            const combatants = await combat.createEmbeddedDocuments(
                "Combatant",
                [
                    {
                        tokenId: token.id,
                        actorId: token.actor?.id,
                        sceneId: token.scene.id,
                        hidden: token.document.hidden,
                    },
                ],
                { render },
            );
            return combatants.at(0) ?? null;
        }
        ui.notifications.error(game.i18n.format("AVANT.Encounter.NoTokenInScene", { actor: actor.name }));
        return null;
    }

    get encounter(): TParent {
        return this.parent;
    }

    /** The round this combatant last had a turn */
    get roundOfLastTurn(): number | null {
        return this.flags.avant.roundOfLastTurn;
    }

    /** Can the user see this combatant's name? */
    get playersCanSeeName(): boolean {
        return !!this.token?.playersCanSeeName;
    }

    overridePriority(initiative: number): number | null {
        return this.flags.avant.overridePriority[initiative] ?? null;
    }

    hasHigherInitiative(
        this: RolledCombatant<NonNullable<TParent>>,
        { than }: { than: RolledCombatant<NonNullable<TParent>> },
    ): boolean {
        if (this.parent.id !== than.parent.id) {
            throw ErrorAvant("The initiative of Combatants from different combats cannot be compared");
        }

        return this.parent.getCombatantWithHigherInit(this, than) === this;
    }

    async startTurn(): Promise<void> {
        const { actor, encounter } = this;
        if (!encounter || !actor) return;

        this.update({ "flags.avant.roundOfLastTurn": encounter.round }, { render: false });

        // Run any turn start events before the effect tracker updates
        const eventType = "turn-start";
        await this.#performActorUpdates(eventType);

        // Effect changes on turn start/end
        for (const effect of actor.itemTypes.effect) {
            await effect.onEncounterEvent(eventType);
        }
        if (actor.isOfType("character") && actor.familiar) {
            for (const effect of actor.familiar.itemTypes.effect) {
                await effect.onEncounterEvent(eventType);
            }
        }

        Hooks.callAll("avant.startTurn", this, encounter, game.user.id);
    }

    async endTurn(options: { round: number }): Promise<void> {
        const round = options.round;
        const { actor, encounter } = this;
        if (!encounter || !actor) return;

        // Run condition end of turn effects
        const activeConditions = actor.conditions.active;
        for (const condition of activeConditions) {
            await condition.onEndTurn({ token: this.token });
        }

        // Effect changes on turn start/end
        const eventType = "turn-end";
        for (const effect of actor.itemTypes.effect) {
            await effect.onEncounterEvent(eventType);
        }
        if (actor.isOfType("character") && actor.familiar) {
            for (const effect of actor.familiar.itemTypes.effect) {
                await effect.onEncounterEvent(eventType);
            }
        }

        await this.update({ "flags.avant.roundOfLastTurnEnd": round });
        Hooks.callAll("avant.endTurn", this, encounter, game.user.id);
    }

    protected override _initialize(options?: Record<string, unknown>): void {
        this.initialized = false;
        super._initialize(options);
    }

    /**
     * If embedded, don't prepare data if the parent hasn't finished initializing.
     * @todo remove in V13
     */
    override prepareData(): void {
        if (game.release.generation === 12 && (this.initialized || (this.parent && !this.parent.initialized))) {
            return;
        }
        this.initialized = true;
        super.prepareData();
    }

    override prepareBaseData(): void {
        super.prepareBaseData();

        this.flags.avant = fu.mergeObject(this.flags.avant ?? {}, { overridePriority: {} });
        this.flags.avant.roundOfLastTurn ??= null;
        this.flags.avant.initiativeStatistic ??= null;
    }

    /** Toggle the defeated status of this combatant, applying or removing the overlay icon on its token */
    async toggleDefeated({ to = !this.isDefeated, overlayIcon = true } = {}): Promise<void> {
        if (to === this.isDefeated) return;

        await this.update({ defeated: to });
        if (overlayIcon) {
            await this.token?.actor?.toggleStatusEffect("dead", { overlay: true });
        }

        /** Remove this combatant's token as a target if it died */
        if (this.isDefeated && this.token?.object?.isTargeted) {
            this.token.object.setTarget(false, { releaseOthers: false });
        }
    }

    /**
     * Hide the tracked resource if the combatant represents a non-player-owned actor
     * @todo Make this a configurable with a metagame-knowledge setting
     */
    override updateResource(): { value: number } | null {
        if (this.isNPC && !game.user.isGM) return (this.resource = null);
        return super.updateResource();
    }

    override _getInitiativeFormula(): string {
        const actor = this.actor;
        const modifier = actor?.initiative?.mod ?? actor?.perception?.mod ?? 0;
        return modifier < 0 ? `1d20${modifier}` : `1d20+${modifier}`;
    }

    /** Toggle the visibility of names to players */
    async toggleNameVisibility(): Promise<void> {
        if (!this.token) return;

        const currentVisibility = this.token.displayName;

        const visibilityToggles = {
            [CONST.TOKEN_DISPLAY_MODES.ALWAYS]: CONST.TOKEN_DISPLAY_MODES.OWNER,
            [CONST.TOKEN_DISPLAY_MODES.CONTROL]: CONST.TOKEN_DISPLAY_MODES.HOVER,
            [CONST.TOKEN_DISPLAY_MODES.HOVER]: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            [CONST.TOKEN_DISPLAY_MODES.NONE]: CONST.TOKEN_DISPLAY_MODES.HOVER,
            [CONST.TOKEN_DISPLAY_MODES.OWNER]: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            [CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER]: CONST.TOKEN_DISPLAY_MODES.HOVER,
        };

        await this.token.update({ displayName: visibilityToggles[currentVisibility] });
    }

    /**
     * Collect and process actor updates received from encounter event callbacks
     * @param event The event type that triggered this request
     */
    async #performActorUpdates(event: "initiative-roll" | "turn-start"): Promise<void> {
        const actor = this.actor;
        if (!actor) return;

        const actorUpdates: Record<string, unknown> = {};
        for (const rule of actor.rules ?? []) {
            await rule.onUpdateEncounter?.({ event, actorUpdates });
        }
        await actor.update(actorUpdates);

        // Refresh usages of any abilities with round durations
        if (event === "turn-start") {
            await actor.recharge({ duration: "round" });
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    protected override _onUpdate(
        changed: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<TParent>,
        userId: string,
    ): void {
        super._onUpdate(changed, operation, userId);

        if (typeof changed.initiative === "number") {
            // Reset actor data in case initiative order changed
            if (this.encounter?.started) this.encounter.resetActors();
            // Make necessary actor and item updates
            if (userId === game.user.id) {
                const eventType = "initiative-roll";
                this.#performActorUpdates(eventType).then(() => {
                    for (const effect of this.actor?.itemTypes.effect ?? []) {
                        effect.onEncounterEvent(eventType);
                    }
                });
            }
        }

        // Send out a message with information on an automatic effect that occurs upon an actor's death
        if (changed.defeated && game.user.id === userId) {
            for (const action of this.actor?.itemTypes.action ?? []) {
                if (action.system.deathNote) {
                    action.toMessage(undefined, { rollMode: this.actor?.hasPlayerOwner ? "publicroll" : "gmroll" });
                }
            }
        }
    }

    protected override _onDelete(operation: DatabaseDeleteOperation<TParent>, userId: string): void {
        super._onDelete(operation, userId);

        // Reset actor data in case initiative order changed
        if (this.encounter?.started) {
            this.encounter.resetActors();
        }
    }
}

interface CombatantAvant<
    TParent extends EncounterAvant | null = EncounterAvant | null,
    TTokenDocument extends TokenDocumentAvant | null = TokenDocumentAvant | null,
> extends Combatant<TParent, TTokenDocument> {
    flags: CombatantFlags;
}

interface CombatantFlags extends DocumentFlags {
    avant: {
        initiativeStatistic: SkillSlug | "perception" | null;
        roundOfLastTurn: number | null;
        roundOfLastTurnEnd: number | null;
        overridePriority: Record<number, number | null | undefined>;
    };
}

type RolledCombatant<TEncounter extends EncounterAvant> = CombatantAvant<TEncounter, TokenDocumentAvant> & {
    initiative: number;
};

export { CombatantAvant };
export type { CombatantFlags, RolledCombatant };
