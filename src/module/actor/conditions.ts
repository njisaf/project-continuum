import type { ConditionAvant } from "@item";
import type { ConditionSlug, PersistentDamageAvant } from "@item/condition/index.ts";
import { DelegatedCollection } from "@util";
import type { ActorAvant } from "./base.ts";

/** A wrapper for collections of conditions on an actor, filterable by whether they're active or stored/temporary */
class ActorConditions<TActor extends ActorAvant> extends DelegatedCollection<ConditionAvant<TActor>> {
    /** A secondary map by condition slug */
    #slugMap = new Collection<ConditionAvant<TActor>[]>();

    /** Whether this collection is finalized following actor data preparation */
    #finalized = false;

    /** Fast lookup for `hasType` */
    #conditionsHad: Set<ConditionSlug> = new Set();

    /** Return an array of only active conditions */
    get active(): ConditionAvant<TActor>[] {
        return this.filter((c) => c.active);
    }

    /** Return an array of only stored conditions */
    get stored(): ConditionAvant<TActor>[] {
        return this.filter((c) => !c.inMemoryOnly);
    }

    /** Convenience getters for active badged conditions, especially for use by @actor resolvables in rule elements */
    get clumsy(): ConditionAvant<TActor> | null {
        return this.bySlug("clumsy", { active: true }).shift() ?? null;
    }

    get cursebound(): ConditionAvant<TActor> | null {
        return this.bySlug("cursebound", { active: true }).shift() ?? null;
    }

    get doomed(): ConditionAvant<TActor> | null {
        return this.bySlug("doomed", { active: true }).shift() ?? null;
    }

    get drained(): ConditionAvant<TActor> | null {
        return this.bySlug("drained", { active: true }).shift() ?? null;
    }

    get dying(): ConditionAvant<TActor> | null {
        return this.bySlug("dying", { active: true }).shift() ?? null;
    }

    get enfeebled(): ConditionAvant<TActor> | null {
        return this.bySlug("enfeebled", { active: true }).shift() ?? null;
    }

    get frightened(): ConditionAvant<TActor> | null {
        return this.bySlug("frightened", { active: true }).shift() ?? null;
    }

    get sickened(): ConditionAvant<TActor> | null {
        return this.bySlug("sickened", { active: true }).shift() ?? null;
    }

    get slowed(): ConditionAvant<TActor> | null {
        return this.bySlug("slowed", { active: true }).shift() ?? null;
    }

    get stunned(): ConditionAvant<TActor> | null {
        return this.bySlug("stunned", { active: true }).shift() ?? null;
    }

    get stupefied(): ConditionAvant<TActor> | null {
        return this.bySlug("stupefied", { active: true }).shift() ?? null;
    }

    get wounded(): ConditionAvant<TActor> | null {
        return this.bySlug("wounded", { active: true }).shift() ?? null;
    }

    /** Whether the actor has a condition of a certain type */
    hasType(slug: ConditionSlug): boolean {
        return this.#finalized ? this.#conditionsHad.has(slug) : this.bySlug(slug, { active: true }).length > 0;
    }

    /** Finalize the conditions this actor has, populating #conditionsHad */
    finalize(): void {
        this.#conditionsHad = new Set(this.active.map((c) => c.slug));
        this.#finalized = true;
    }

    /** Provide additional options for retrieving a condition */
    override get(
        key: Maybe<string>,
        options: { strict: true; active?: boolean | null; temporary?: boolean | null },
    ): ConditionAvant<TActor>;
    override get(key: string, options?: ConditionsGetOptions): ConditionAvant<TActor> | undefined;
    override get(
        key: string,
        { strict = false, active = null, temporary = null }: ConditionsGetOptions = {},
    ): ConditionAvant<TActor> | undefined {
        const condition = super.get(key, { strict });
        if (active === true && !condition?.active) return undefined;
        if (active === false && condition?.active) return undefined;
        if (temporary === true && condition?.actor.items.has(key)) return undefined;
        if (temporary === false && !condition?.actor.items.has(key)) return undefined;

        return condition;
    }

    override set(id: string, condition: ConditionAvant<TActor>): this {
        super.set(id, condition);
        const listBySlug = this.#slugMap.get(condition.slug) ?? [];
        listBySlug.push(condition);
        this.#slugMap.set(condition.slug, listBySlug);

        return this;
    }

    every(condition: (value: ConditionAvant<TActor>) => boolean): boolean {
        return this.contents.every(condition);
    }

    /** No deletions: a new instance is created every data preparation cycle */
    override delete(): false {
        return false;
    }

    /**
     * Get an array of conditions by slug
     * The "dead" slug is permitted due to `StatusEffectsAvant`'s usage of this class, though it will always return an
     * empty array.
     */
    bySlug(slug: "persistent-damage", options?: ConditionsBySlugOptions): PersistentDamageAvant<TActor>[];
    bySlug(slug: "dead", options?: ConditionsBySlugOptions): never[];
    bySlug(slug: ConditionSlug | "dead", options?: ConditionsBySlugOptions): ConditionAvant<TActor>[];
    bySlug(slug: string, { active = null, temporary = null }: ConditionsBySlugOptions = {}): ConditionAvant<TActor>[] {
        return (this.#slugMap.get(slug) ?? []).filter((condition): boolean => {
            const activeFilterSatisfied =
                active === true ? condition.active : active === false ? !condition.active : true;
            const temporaryFilterSatisfied =
                temporary === true
                    ? !condition.actor.items.has(condition.id)
                    : temporary === false
                      ? condition.actor.items.has(condition.id)
                      : true;
            return activeFilterSatisfied && temporaryFilterSatisfied;
        });
    }
}

interface ConditionsGetOptions extends CollectionGetOptions {
    /** Filter by the active state of the condition: `null` will return one in either state */
    active?: boolean | null;
    /**
     * Filter by the whether the condition is temporary (in-memory) or stored on the actor: `null` will return
     * a condition of either kind
     */
    temporary?: boolean | null;
}

type ConditionsBySlugOptions = Omit<ConditionsGetOptions, "strict">;

export { ActorConditions };
